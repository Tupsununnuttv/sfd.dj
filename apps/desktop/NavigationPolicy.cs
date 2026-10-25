namespace SfdDj.Desktop;

internal static class NavigationPolicy
{
    internal static readonly Uri Home = new("https://sfd-dj.eu/");
    private static readonly HashSet<string> SignInHosts = new(StringComparer.OrdinalIgnoreCase)
    {
        "discord.com", "accounts.google.com", "accounts.spotify.com", "id.twitch.tv",
        "www.facebook.com", "facebook.com", "www.reddit.com", "www.instagram.com",
        "instagram.com", "twitter.com", "x.com", "api.x.com",
    };

    internal static bool IsSite(Uri uri) => uri.IsAbsoluteUri && uri.Scheme == Uri.UriSchemeHttps
        && uri.IsDefaultPort && uri.UserInfo.Length == 0
        && (uri.Host.Equals("sfd-dj.eu", StringComparison.OrdinalIgnoreCase) || uri.Host.Equals("www.sfd-dj.eu", StringComparison.OrdinalIgnoreCase));

    internal static bool IsSignIn(Uri uri) => uri.IsAbsoluteUri && uri.Scheme == Uri.UriSchemeHttps
        && uri.IsDefaultPort && uri.UserInfo.Length == 0 && SignInHosts.Contains(uri.Host);

    internal static bool IsInApp(Uri uri) => IsSite(uri) || IsSignIn(uri);

    internal static bool CanOpenExternal(Uri uri) => uri.IsAbsoluteUri
        && (uri.Scheme == Uri.UriSchemeMailto || (uri.UserInfo.Length == 0 && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp)));
}
