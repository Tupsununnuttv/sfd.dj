using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;

namespace SfdDj.Desktop;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        if (!WindowsPlatform.IsSupported)
        {
            MessageBox.Show("SFD DJ Desktop requires Windows 11 (64-bit). You can use https://sfd-dj.eu in your browser on other operating systems.",
                "Windows 11 required", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
        Application.ThreadException += (_, error) => MessageBox.Show(error.Exception.Message, "SFD DJ Desktop", MessageBoxButtons.OK, MessageBoxIcon.Error);
        var profileOverride = Environment.GetEnvironmentVariable("SFD_DJ_PROFILE_DIRECTORY");
        var profileIdentity = string.IsNullOrWhiteSpace(profileOverride) ? "" : "-" + Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(Path.GetFullPath(profileOverride).ToUpperInvariant())))[..16];
        using var instance = new Mutex(true, "Local\\SFD-DJ-Desktop-" + Environment.UserName + profileIdentity, out var first);
        if (!first)
        {
            using var current = Process.GetCurrentProcess();
            foreach (var process in Process.GetProcessesByName(current.ProcessName))
            {
                using (process)
                {
                    if (process.Id == current.Id || process.MainWindowHandle == IntPtr.Zero) continue;
                    ShowWindow(process.MainWindowHandle, 9);
                    SetForegroundWindow(process.MainWindowHandle);
                    break;
                }
            }
            return;
        }
        Application.Run(new DesktopWindow());
    }

    [DllImport("user32.dll")] private static extern bool SetForegroundWindow(IntPtr window);
    [DllImport("user32.dll")] private static extern bool ShowWindow(IntPtr window, int command);
}
