<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/** YouTube lookups. Uses the Data API when YOUTUBE_API_KEY is set; otherwise falls back to oEmbed (no duration, no search). */
class YouTube
{
    private const API = 'https://www.googleapis.com/youtube/v3';

    public function hasKey(): bool
    {
        return (bool) config('services.youtube.key');
    }

    /** Pull the 11-character video id out of a YouTube link, or null. */
    public function idFromUrl(string $url): ?string
    {
        return preg_match('~(?:youtu\.be/|youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/))([\w-]{11})~', $url, $m) ? $m[1] : null;
    }

    /** @return array{title: string, channel: string|null, thumbnail: string, duration: int}|null null = missing or not embeddable */
    public function video(string $id): ?array
    {
        if ($this->hasKey()) {
            try {
                $res = Http::timeout(5)->get(self::API.'/videos', [
                    'part' => 'snippet,contentDetails,status',
                    'id' => $id,
                    'key' => config('services.youtube.key'),
                ]);
            } catch (ConnectionException) {
                $res = null;
            }

            if ($res?->successful()) {
                $item = $res->json('items.0');

                if (! $item || ($item['status']['embeddable'] ?? true) === false) {
                    return null;
                }

                return [
                    'title' => Str::limit($item['snippet']['title'], 250),
                    'channel' => isset($item['snippet']['channelTitle']) ? Str::limit($item['snippet']['channelTitle'], 120, '') : null,
                    'thumbnail' => 'https://i.ytimg.com/vi/'.$id.'/mqdefault.jpg',
                    'duration' => $this->seconds($item['contentDetails']['duration'] ?? ''),
                ];
            }
            // key rejected or quota used up: fall through to oEmbed so adding songs keeps working
        }

        try {
            $res = Http::timeout(5)->get('https://www.youtube.com/oembed', ['url' => 'https://www.youtube.com/watch?v='.$id, 'format' => 'json']);
        } catch (ConnectionException) {
            return null;
        }

        return $res->successful()
            ? ['title' => Str::limit($res->json('title'), 250), 'channel' => $res->json('author_name') ? Str::limit($res->json('author_name'), 120, '') : null, 'thumbnail' => 'https://i.ytimg.com/vi/'.$id.'/mqdefault.jpg', 'duration' => 0]
            : null;
    }

    /** @return array<int, array{id: string, title: string, channel: string, thumbnail: string}>|null null = search unavailable */
    public function search(string $query): ?array
    {
        if (! $this->hasKey()) {
            return null;
        }

        try {
            $res = Http::timeout(5)->get(self::API.'/search', [
                'part' => 'snippet',
                'type' => 'video',
                'videoEmbeddable' => 'true',
                'maxResults' => 8,
                'q' => $query,
                'key' => config('services.youtube.key'),
            ]);
        } catch (ConnectionException) {
            return null;
        }

        if (! $res->successful()) {
            return null;
        }

        return collect($res->json('items', []))->map(fn ($i) => [
            'id' => $i['id']['videoId'],
            'title' => html_entity_decode($i['snippet']['title'], ENT_QUOTES),
            'channel' => $i['snippet']['channelTitle'],
            'thumbnail' => $i['snippet']['thumbnails']['medium']['url'] ?? 'https://i.ytimg.com/vi/'.$i['id']['videoId'].'/mqdefault.jpg',
        ])->values()->all();
    }

    /**
     * The first `$max` playable videos of a YouTube playlist, with durations.
     *
     * @return array<int, array{id: string, title: string, channel: string|null, thumbnail: string, duration: int}>|null null = unavailable
     */
    public function playlist(string $playlistId, int $max = 25): ?array
    {
        if (! $this->hasKey()) {
            return null;
        }

        try {
            $list = Http::timeout(6)->get(self::API.'/playlistItems', [
                'part' => 'contentDetails',
                'playlistId' => $playlistId,
                'maxResults' => min($max, 50),
                'key' => config('services.youtube.key'),
            ]);

            if (! $list->successful()) {
                return null;
            }

            $ids = collect($list->json('items', []))->pluck('contentDetails.videoId')->filter()->implode(',');
            if ($ids === '') {
                return [];
            }

            $videos = Http::timeout(6)->get(self::API.'/videos', [
                'part' => 'snippet,contentDetails,status',
                'id' => $ids,
                'key' => config('services.youtube.key'),
            ]);
        } catch (ConnectionException) {
            return null;
        }

        return $videos->successful()
            ? collect($videos->json('items', []))
                ->filter(fn ($v) => ($v['status']['embeddable'] ?? true) !== false)
                ->map(fn ($v) => [
                    'id' => $v['id'],
                    'title' => Str::limit($v['snippet']['title'], 250),
                    'channel' => isset($v['snippet']['channelTitle']) ? Str::limit($v['snippet']['channelTitle'], 120, '') : null,
                    'thumbnail' => 'https://i.ytimg.com/vi/'.$v['id'].'/mqdefault.jpg',
                    'duration' => $this->seconds($v['contentDetails']['duration'] ?? ''),
                ])->values()->all()
            : null;
    }

    /** ISO 8601 duration (PT3M33S) to seconds. Live streams ("P0D") give 0. */
    private function seconds(string $iso): int
    {
        try {
            $d = new \DateInterval($iso);
        } catch (\Exception) {
            return 0;
        }

        return $d->d * 86400 + $d->h * 3600 + $d->i * 60 + $d->s;
    }
}
