using System.Runtime.InteropServices;

namespace SfdDj.Desktop;

internal static class WindowsPlatform
{
    internal const uint MinimumBuild = 22000;

    internal static bool Allows(uint major, uint minor, uint build, byte productType) =>
        major == 10 && minor == 0 && build >= MinimumBuild && productType == 1;

    internal static bool IsSupported
    {
        get
        {
            if (!OperatingSystem.IsWindows() || !Environment.Is64BitOperatingSystem) return false;
            var version = new OsVersion { Size = (uint)Marshal.SizeOf<OsVersion>(), ServicePack = string.Empty };
            return RtlGetVersion(ref version) == 0 && Allows(version.Major, version.Minor, version.Build, version.ProductType);
        }
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct OsVersion
    {
        internal uint Size, Major, Minor, Build, Platform;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] internal string ServicePack;
        internal ushort ServicePackMajor, ServicePackMinor, SuiteMask;
        internal byte ProductType, Reserved;
    }

    [DllImport("ntdll.dll", CharSet = CharSet.Unicode)]
    private static extern int RtlGetVersion(ref OsVersion version);
}
