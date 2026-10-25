using System.Security.Cryptography;
using System.Text;
using Microsoft.Web.WebView2.Core;
using Windows.Security.Cryptography;
using Windows.System.Profile;

namespace SfdDj.Desktop;

/// <summary>Purpose-scoped hash of Windows' system ID; no raw hardware IDs leave the app.</summary>
internal sealed record DeviceIdentity(string Hash, string Source)
{
    private static readonly Lazy<DeviceIdentity?> identity = new(Read);
    internal static DeviceIdentity? Current => identity.Value;

    private static DeviceIdentity? Read()
    {
        try
        {
            var system = SystemIdentification.GetSystemIdForPublisher();
            if (system.Id.Length == 0 || system.Source == SystemIdentificationSource.None) return null;
            var raw = CryptographicBuffer.EncodeToHexString(system.Id);
            var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("sfd-dj.eu|device-ban|v1|" + raw))).ToLowerInvariant();
            return new(hash, system.Source.ToString().ToLowerInvariant());
        }
        catch { return null; } // A Windows API failure must not break music or sign-in.
    }

    internal static void Apply(CoreWebView2WebResourceRequest request)
    {
        // Strip on external requests as well, including redirects and sign-in popups.
        foreach (var header in new[] { "X-SFD-Device-Id", "X-SFD-Device-Source" })
            if (request.Headers.Contains(header)) request.Headers.RemoveHeader(header);
        if (!Uri.TryCreate(request.Uri, UriKind.Absolute, out var target) || !NavigationPolicy.IsSite(target) || Current is not { } device) return;
        request.Headers.SetHeader("X-SFD-Device-Id", device.Hash);
        request.Headers.SetHeader("X-SFD-Device-Source", device.Source);
    }
}
