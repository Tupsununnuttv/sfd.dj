using System.Diagnostics;
using System.Reflection;
using Microsoft.Web.WebView2.Core;

namespace SfdDj.Desktop;

internal static class RuntimeInstaller
{
    internal static bool IsAvailable()
    {
        try { return !string.IsNullOrWhiteSpace(CoreWebView2Environment.GetAvailableBrowserVersionString()); }
        catch (WebView2RuntimeNotFoundException) { return false; }
    }

    internal static async Task InstallAsync()
    {
        // The build verifies Microsoft's Authenticode signature before embedding this installer.
        var directory = Path.Combine(Path.GetTempPath(), "SFD-DJ-WebView2-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        var installer = Path.Combine(directory, "MicrosoftEdgeWebView2Setup.exe");
        try
        {
            await using (var resource = Assembly.GetExecutingAssembly().GetManifestResourceStream("WebView2Setup")
                ?? throw new IOException("The WebView2 installer is missing."))
            await using (var output = new FileStream(installer, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                await resource.CopyToAsync(output);

            using var process = Process.Start(new ProcessStartInfo(installer, "/silent /install")
            {
                UseShellExecute = false, CreateNoWindow = true,
            }) ?? throw new IOException("The WebView2 installer could not start.");
            using var timeout = new CancellationTokenSource(TimeSpan.FromMinutes(5));
            await process.WaitForExitAsync(timeout.Token);
            if (!IsAvailable()) throw new IOException("WebView2 could not be installed. Check your internet connection and try again.");
        }
        finally
        {
            // Delete only files created by this invocation; never touch another installation.
            try { File.Delete(installer); Directory.Delete(directory); } catch (IOException) { }
        }
    }
}
