<?php

namespace App\Support;

use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class StreamingUrl
{
    private const HOSTS = [
        'youtube.com' => 'youtube', 'www.youtube.com' => 'youtube', 'm.youtube.com' => 'youtube', 'music.youtube.com' => 'youtube', 'youtu.be' => 'youtube',
        'open.spotify.com' => 'spotify',
        'soundcloud.com' => 'soundcloud', 'www.soundcloud.com' => 'soundcloud', 'm.soundcloud.com' => 'soundcloud', 'on.soundcloud.com' => 'soundcloud',
    ];

    public static function provider(string $url): string
    {
        $parts = parse_url($url);
        $provider = self::HOSTS[strtolower($parts['host'] ?? '')] ?? null;
        if (! $parts || ($parts['scheme'] ?? '') !== 'https' || ! $provider || isset($parts['user']) || isset($parts['pass']) || isset($parts['port']) || preg_match('/[\x00-\x20\\\\]/', $url)) {
            throw ValidationException::withMessages(['url' => 'Use an HTTPS link from YouTube, Spotify or SoundCloud, without a custom port or login details.']);
        }
        return $provider;
    }

    /** Validate every redirect before following it, including shortened SoundCloud links. */
    public static function page(string $url): Response
    {
        $provider = self::provider($url);
        for ($hop = 0; $hop < 4; $hop++) {
            if (self::provider($url) !== $provider) break;
            $response = Http::withoutRedirecting()->timeout(6)->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; SFD-DJ.EU)'])->get($url);
            if (! $response->redirect()) return $response;
            $location = $response->header('Location');
            if (! $location) break;
            $url = (string) UriResolver::resolve(new Uri($url), new Uri($location));
        }
        throw ValidationException::withMessages(['url' => 'This streaming link redirects to an unsupported address. Use the full track or playlist link.']);
    }
}
