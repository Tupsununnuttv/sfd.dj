using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace SfdDj.Desktop;

internal sealed class DesktopWindow : Form
{
    private readonly WebView2 view = new() { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.FromArgb(10, 10, 10) };
    private readonly ToolStrip toolbar = new() { GripStyle = ToolStripGripStyle.Hidden, BackColor = Color.FromArgb(20, 17, 26), ForeColor = Color.White, Padding = new Padding(4) };
    private readonly ToolStripButton back = new("Back"), forward = new("Forward"), reload = new("Reload");
    private readonly ToolStripLabel status = new("Connecting to SFD DJ...");
    private readonly Panel notice = new() { Dock = DockStyle.Fill, BackColor = Color.FromArgb(10, 10, 10) };
    private readonly Label noticeText = new() { AutoSize = false, ForeColor = Color.White, Font = new Font("Segoe UI", 12), TextAlign = ContentAlignment.MiddleCenter, Dock = DockStyle.Fill };
    private readonly Button retry = new() { Text = "Try again", AutoSize = true, BackColor = Color.FromArgb(109, 40, 217), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Padding = new Padding(12, 8, 12, 8) };
    private readonly string dataDirectory = Environment.GetEnvironmentVariable("SFD_DJ_PROFILE_DIRECTORY") is { Length: > 0 } profile
        ? Path.GetFullPath(profile)
        : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "SFD-DJ", "Desktop");
    private bool initializing, manualFullscreen, webFullscreen;
    private Rectangle savedBounds;
    private FormWindowState savedState;

    internal DesktopWindow()
    {
        Text = "SFD DJ Desktop";
        ClientSize = new Size(1280, 820);
        MinimumSize = new Size(900, 600);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(10, 10, 10);
        using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("AppIcon"))
        using (var icon = stream is null ? null : new Icon(stream))
            if (icon is not null) Icon = (Icon)icon.Clone();
        RestoreWindow();

        back.Click += (_, _) => { if (view.CanGoBack) view.GoBack(); };
        forward.Click += (_, _) => { if (view.CanGoForward) view.GoForward(); };
        reload.Click += (_, _) => { if (view.CoreWebView2 is not null) view.Reload(); else _ = InitializeAsync(); };
        var home = new ToolStripButton("Home");
        home.Click += (_, _) => view.CoreWebView2?.Navigate(NavigationPolicy.Home.AbsoluteUri);
        var browser = new ToolStripButton("Open in browser") { Alignment = ToolStripItemAlignment.Right };
        browser.Click += (_, _) => OpenExternal(view.Source is { } uri && NavigationPolicy.IsInApp(uri) ? uri : NavigationPolicy.Home);
        toolbar.Items.AddRange([back, forward, reload, home, new ToolStripSeparator(), status, browser]);
        toolbar.Dock = DockStyle.Top;
        back.Enabled = forward.Enabled = false;
        view.KeyDown += (_, args) =>
        {
            if (args.KeyCode == Keys.F11) { args.SuppressKeyPress = true; manualFullscreen = !manualFullscreen; UpdateFullscreen(); }
            if (args.KeyCode == Keys.R && args.Control) { args.SuppressKeyPress = true; if (view.CoreWebView2 is not null) view.Reload(); }
            if (args.KeyCode == Keys.W && args.Control) { args.SuppressKeyPress = true; Close(); }
        };
        Controls.Add(view);
        Controls.Add(notice);
        Controls.Add(toolbar);
        var action = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 85, FlowDirection = FlowDirection.LeftToRight, Padding = new Padding(24), BackColor = BackColor };
        action.Controls.Add(retry);
        notice.Controls.Add(noticeText);
        notice.Controls.Add(action);
        noticeText.Text = "Connecting to SFD DJ...";
        retry.Click += async (_, _) =>
        {
            retry.Enabled = false;
            try { if (!RuntimeInstaller.IsAvailable()) await RuntimeInstaller.InstallAsync(); await InitializeAsync(); }
            catch (Exception error) { ShowNotice(error.Message, "Try again"); }
            finally { retry.Enabled = true; }
        };
        Shown += async (_, _) => await InitializeAsync();
        FormClosing += (_, _) => SaveWindow();
        FormClosed += (_, _) => view.Dispose();
    }

    protected override void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);
        var dark = 1;
        DwmSetWindowAttribute(Handle, 20, ref dark, sizeof(int));
    }

    private async Task InitializeAsync()
    {
        if (initializing) return;
        if (!RuntimeInstaller.IsAvailable())
        {
            ShowNotice("SFD DJ needs Microsoft Edge WebView2. Click below to install it, then the app will open. An internet connection is required.", "Install WebView2");
            return;
        }
        initializing = true;
        try
        {
            if (view.CoreWebView2 is null)
            {
                Directory.CreateDirectory(dataDirectory);
                var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: Path.Combine(dataDirectory, "Profile"));
                await view.EnsureCoreWebView2Async(environment);
                var core = view.CoreWebView2 ?? throw new InvalidOperationException("The browser did not initialize.");
                Configure(core, this);
                core.NavigationStarting += (_, args) =>
                {
                    status.Text = "Loading...";
                };
                core.NavigationCompleted += (_, args) =>
                {
                    back.Enabled = view.CanGoBack;
                    forward.Enabled = view.CanGoForward;
                    status.Text = view.Source is { } source && NavigationPolicy.IsSignIn(source) ? "Sign in: " + source.Host : "SFD DJ";
                    Text = view.Source is { } signIn && NavigationPolicy.IsSignIn(signIn) ? signIn.Host + " - SFD DJ Desktop" : "SFD DJ Desktop";
                    if (!args.IsSuccess && args.WebErrorStatus != CoreWebView2WebErrorStatus.OperationCanceled)
                        status.Text = "Connection interrupted - Reload to try again";
                };
                core.HistoryChanged += (_, _) => { back.Enabled = view.CanGoBack; forward.Enabled = view.CanGoForward; };
                core.ContainsFullScreenElementChanged += (_, _) => { webFullscreen = core.ContainsFullScreenElement; UpdateFullscreen(); };
            }
            notice.Visible = false;
            view.CoreWebView2.Navigate(NavigationPolicy.Home.AbsoluteUri);
        }
        catch (Exception error) { ShowNotice("SFD DJ could not start. " + error.Message, "Try again"); }
        finally { initializing = false; }
    }

    private void Configure(CoreWebView2 core, Form owner)
    {
        core.AddWebResourceRequestedFilter("*", CoreWebView2WebResourceContext.All, CoreWebView2WebResourceRequestSourceKinds.All);
        core.WebResourceRequested += (_, args) => DeviceIdentity.Apply(args.Request);
        core.Settings.AreHostObjectsAllowed = false;
        core.Settings.IsWebMessageEnabled = false;
        core.Settings.AreDevToolsEnabled = false;
        core.Settings.IsStatusBarEnabled = false;
        core.Settings.IsPasswordAutosaveEnabled = false;
        core.NavigationStarting += (_, args) =>
        {
            if (args.Uri == "about:blank" && owner != this) return;
            if (Uri.TryCreate(args.Uri, UriKind.Absolute, out var target) && NavigationPolicy.IsInApp(target)) return;
            args.Cancel = true;
            if (target is not null && (args.IsUserInitiated || (args.IsRedirected && Uri.TryCreate(core.Source, UriKind.Absolute, out var previous) && NavigationPolicy.IsInApp(previous)))) OpenExternal(target);
        };
        core.PermissionRequested += (_, args) =>
        {
            if (!Uri.TryCreate(args.Uri, UriKind.Absolute, out var source) || !NavigationPolicy.IsSite(source))
                args.State = CoreWebView2PermissionState.Deny;
            // First-party camera/microphone permissions retain WebView2's user prompt.
        };
        core.NewWindowRequested += async (_, args) =>
        {
            args.Handled = true;
            var blank = args.Uri == "about:blank";
            if (!Uri.TryCreate(args.Uri, UriKind.Absolute, out var target)) return;
            if (!NavigationPolicy.IsInApp(target) && !blank) { if (args.IsUserInitiated) OpenExternal(target); return; }
            if (!args.IsUserInitiated) return;
            using var deferral = args.GetDeferral();
            var popup = new Form { Text = "SFD DJ", ClientSize = new Size(1000, 720), MinimumSize = new Size(400, 300), BackColor = BackColor, Icon = Icon };
            var child = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = BackColor };
            popup.Controls.Add(child);
            popup.FormClosed += (_, _) => child.Dispose();
            popup.Show(owner);
            try
            {
                await child.EnsureCoreWebView2Async(core.Environment);
                Configure(child.CoreWebView2, popup);
                args.NewWindow = child.CoreWebView2;
            }
            catch { popup.Close(); }
        };
        core.WindowCloseRequested += (_, _) => owner.Close();
    }

    private static void OpenExternal(Uri uri)
    {
        if (!NavigationPolicy.CanOpenExternal(uri)) return;
        try { Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true }); }
        catch (Exception error) { MessageBox.Show(error.Message, "Could not open the browser", MessageBoxButtons.OK, MessageBoxIcon.Information); }
    }

    private void ShowNotice(string text, string button)
    {
        noticeText.Text = text;
        retry.Text = button;
        notice.Visible = true;
        notice.BringToFront();
        toolbar.BringToFront();
    }

    private void UpdateFullscreen()
    {
        var fullscreen = manualFullscreen || webFullscreen;
        if (fullscreen && FormBorderStyle != FormBorderStyle.None)
        {
            savedState = WindowState;
            savedBounds = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
            WindowState = FormWindowState.Normal;
            FormBorderStyle = FormBorderStyle.None;
            Bounds = Screen.FromControl(this).Bounds;
            toolbar.Visible = false;
        }
        else if (!fullscreen && FormBorderStyle == FormBorderStyle.None)
        {
            FormBorderStyle = FormBorderStyle.Sizable;
            Bounds = savedBounds;
            WindowState = savedState;
            toolbar.Visible = true;
        }
    }

    private void RestoreWindow()
    {
        try
        {
            var state = JsonSerializer.Deserialize<WindowPlacement>(File.ReadAllText(Path.Combine(dataDirectory, "window.json")));
            if (state is null || state.Width < 900 || state.Height < 600) return;
            var bounds = new Rectangle(state.X, state.Y, state.Width, state.Height);
            if (!Screen.AllScreens.Any(screen => screen.WorkingArea.IntersectsWith(bounds))) return;
            StartPosition = FormStartPosition.Manual;
            Bounds = bounds;
            if (state.Maximized) WindowState = FormWindowState.Maximized;
        }
        catch (Exception error) when (error is IOException or JsonException or UnauthorizedAccessException) { }
    }

    private void SaveWindow()
    {
        try
        {
            Directory.CreateDirectory(dataDirectory);
            var bounds = FormBorderStyle == FormBorderStyle.None ? savedBounds : WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
            var maximized = FormBorderStyle == FormBorderStyle.None ? savedState == FormWindowState.Maximized : WindowState == FormWindowState.Maximized;
            File.WriteAllText(Path.Combine(dataDirectory, "window.json"), JsonSerializer.Serialize(new WindowPlacement(bounds.X, bounds.Y, bounds.Width, bounds.Height, maximized)));
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException) { }
    }

    private sealed record WindowPlacement(int X, int Y, int Width, int Height, bool Maximized);
    [DllImport("dwmapi.dll")] private static extern int DwmSetWindowAttribute(IntPtr window, int attribute, ref int value, int size);
}
