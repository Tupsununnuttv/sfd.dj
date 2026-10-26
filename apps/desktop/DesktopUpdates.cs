using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace SfdDj.Desktop;

internal sealed record DesktopRelease(Version Version, string DisplayVersion);

internal static class DesktopUpdates
{
    internal static readonly Uri DownloadPage = new("https://sfd-dj.eu/download");
    internal static Version CurrentVersion
    {
        get
        {
            var version = Assembly.GetExecutingAssembly().GetName().Version ?? new Version(0, 0, 0);
            return new Version(version.Major, version.Minor, Math.Max(0, version.Build));
        }
    }

    internal static HttpClient CreateClient() => new(new HttpClientHandler { AllowAutoRedirect = false, UseCookies = false })
    {
        Timeout = TimeSpan.FromSeconds(15),
    };

    internal static async Task<DesktopRelease> CheckAsync(HttpClient client, CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(15));
        // Bypass a stale edge copy, including when the user explicitly checks again.
        using var request = new HttpRequestMessage(HttpMethod.Get,
            "https://sfd-dj.eu/downloads/desktop-release.json?check=" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.CacheControl = new CacheControlHeaderValue { NoCache = true };
        request.Headers.UserAgent.ParseAdd("SFD-DJ-Desktop/" + CurrentVersion);
        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
        response.EnsureSuccessStatusCode();
        if (response.Content.Headers.ContentType?.MediaType is not "application/json")
            throw new InvalidDataException("The update server did not return release information.");
        await response.Content.LoadIntoBufferAsync(64 * 1024, timeout.Token);
        using var document = JsonDocument.Parse(await response.Content.ReadAsByteArrayAsync(timeout.Token),
            new JsonDocumentOptions { MaxDepth = 8 });
        return ParseRelease(document.RootElement);
    }

    internal static DesktopRelease ParseRelease(JsonElement release)
    {
        static string? Field(JsonElement root, string name) => root.ValueKind == JsonValueKind.Object
            && root.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
        var text = Field(release, "version");
        if (text is null || !Regex.IsMatch(text, @"^\d{1,6}\.\d{1,6}\.\d{1,6}$", RegexOptions.CultureInvariant)
            || !Version.TryParse(text, out var version)
            || Field(release, "kind") != "installer" || Field(release, "platform") != "windows11-x64"
            || Field(release, "file") != "/downloads/SFD-DJ-Setup.exe")
            throw new InvalidDataException("The update server returned invalid release information.");
        // Only report stable official desktop releases. Never execute a URL from this JSON.
        return new DesktopRelease(version, text);
    }
}
