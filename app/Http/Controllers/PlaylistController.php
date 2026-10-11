<?php

namespace App\Http\Controllers;

use App\Models\Playlist;
use App\Models\PlaylistSong;
use App\Models\User;
use App\Services\Music;
use App\Services\YouTube;
use App\Support\Plans;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The user's playlists. The page is Inertia; the playlist manager itself (also used inside rooms) talks to the JSON routes below.
 * Songs always play from YouTube; SoundCloud and Spotify links are matched to a YouTube video (see Music).
 * One list is the person's active one: its first song is their next track (the footbar of a room shows it), and "Join Waitlist" queues it.
 */
class PlaylistController extends Controller
{
    public const MAX_PLAYLISTS = 30; // without a plan: Plus and Premium allow more (App\Support\Plans)

    private const SONG_FIELDS = ['id', 'youtube_id', 'title', 'channel', 'thumbnail', 'duration', 'origin', 'position'];

    public function index(): Response
    {
        return Inertia::render('Playlists');
    }

    public function spotifyConnect(Request $request): RedirectResponse
    {
        $clientId = config('services.spotify.client_id');
        abort_unless($clientId && config('services.spotify.client_secret'), 503, 'Spotify playlist imports are not configured.');

        $state = Str::random(48);
        $request->session()->put('spotify.oauth_state', $state);
        $returnTo = route('playlists');
        $referer = $request->headers->get('referer');
        if (! $request->boolean('resume_import') && is_string($referer)) {
            $refererParts = parse_url($referer);
            if (($refererParts['host'] ?? null) === $request->getHost()) {
                $returnTo = ($refererParts['path'] ?? '/playlists').(isset($refererParts['query']) ? '?'.$refererParts['query'] : '');
            }
        }
        $request->session()->put('spotify.return_to', $returnTo);
        $redirectUri = config('services.spotify.redirect_uri') ?: route('spotify.callback');

        return redirect('https://accounts.spotify.com/authorize?'.http_build_query([
            'client_id' => $clientId,
            'response_type' => 'code',
            'redirect_uri' => $redirectUri,
            'scope' => 'playlist-read-private playlist-read-collaborative',
            'state' => $state,
            'show_dialog' => 'true',
        ]));
    }

    public function spotifyCallback(Request $request): RedirectResponse
    {
        $expectedState = $request->session()->pull('spotify.oauth_state');
        $state = $request->query('state');
        abort_unless(is_string($expectedState) && is_string($state) && hash_equals($expectedState, $state), 403, 'Spotify authorization state did not match. Try connecting again.');

        if ($request->filled('error')) {
            return redirect()->route('playlists');
        }

        $code = $request->query('code');
        abort_unless(is_string($code) && $code !== '', 400, 'Spotify did not return an authorization code.');

        try {
            $response = Http::timeout(10)->asForm()->withBasicAuth(
                config('services.spotify.client_id'),
                config('services.spotify.client_secret'),
            )->post('https://accounts.spotify.com/api/token', [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => config('services.spotify.redirect_uri') ?: route('spotify.callback'),
            ]);
        } catch (ConnectionException) {
            abort(502, 'Could not reach Spotify to complete authorization.');
        }
        abort_unless($response->successful() && $response->json('access_token'), 502, 'Spotify authorization failed. Check the app credentials and registered redirect URL.');

        $request->session()->put([
            'spotify.access_token' => $response->json('access_token'),
            'spotify.refresh_token' => $response->json('refresh_token'),
            'spotify.expires_at' => now()->addSeconds((int) $response->json('expires_in', 3600))->timestamp,
        ]);

        return redirect()->to($request->session()->pull('spotify.return_to', route('playlists')));
    }

    public function list(Request $request): JsonResponse
    {
        Playlist::activeFor($request->user()); // one of the lists is the active one

        return response()->json(
            Playlist::where('user_id', $request->user()->id)->withCount('songs')->withSum('songs', 'duration')
                ->orderBy('name')->get(['id', 'name', 'kind', 'is_active'])
        );
    }

    /** What the footbar of a room shows: my lists (the active one marked) and the next track of the active one. */
    public function deck(Request $request): JsonResponse
    {
        return response()->json($this->deckFor($request->user()));
    }

    public function show(Request $request, Playlist $playlist): JsonResponse
    {
        $this->own($request, $playlist);

        return response()->json($playlist->songs()->get(self::SONG_FIELDS));
    }

    public function checkAvailability(Request $request, Playlist $playlist, YouTube $youtube): JsonResponse
    {
        $this->own($request, $playlist);
        $songIds = $request->validate([
            'song_ids' => ['required', 'array', 'min:1', 'max:50'],
            'song_ids.*' => ['required', 'integer', 'distinct'],
        ])['song_ids'];
        $songs = $playlist->songs()->whereIn('id', $songIds)->get(['id', 'youtube_id']);
        abort_if($songs->count() !== count($songIds), 404);

        $availability = $youtube->availability($songs->pluck('youtube_id')->all());
        abort_if($availability === null, 503, 'Could not check YouTube availability. Try again later or configure YOUTUBE_API_KEY.');

        return response()->json([
            'availability' => $songs->mapWithKeys(fn (PlaylistSong $song) => [$song->id => $availability[$song->youtube_id] ?? false]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:60']]);
        abort_if(Playlist::where('user_id', $request->user()->id)->count() >= $request->user()->limits()['playlists'], 422, 'You have reached the playlist limit.');

        $playlist = $request->user()->playlists()->create($data + ['kind' => 'custom']);
        Playlist::activeFor($request->user()); // the first list a person makes is their active one

        return response()->json($playlist->refresh()->only('id', 'name', 'kind', 'is_active'), 201);
    }

    public function update(Request $request, Playlist $playlist): JsonResponse
    {
        $this->own($request, $playlist);

        $playlist->update($request->validate(['name' => ['required', 'string', 'max:60']]));

        return response()->json($playlist->only('id', 'name', 'kind', 'is_active'));
    }

    public function destroy(Request $request, Playlist $playlist): JsonResponse
    {
        $this->own($request, $playlist);

        $playlist->delete();
        Playlist::activeFor($request->user()); // if it was the active one, the first of the others takes over

        return response()->json(['ok' => true]);
    }

    /** Make this the list I play from. Answers with the footbar's view of it. */
    public function activate(Request $request, Playlist $playlist): JsonResponse
    {
        $this->own($request, $playlist);

        $playlist->makeActive();

        return response()->json($this->deckFor($request->user()));
    }

    /** Save the order the songs were dragged into: `ids` is the whole list, first song first. */
    public function order(Request $request, Playlist $playlist): JsonResponse
    {
        $this->own($request, $playlist);
        $ids = $request->validate(['ids' => ['required', 'array', 'max:'.Plans::mostSongs()], 'ids.*' => ['integer']])['ids'];

        $playlist->reorder($ids);

        return response()->json(['ok' => true]);
    }

    public function shuffle(Request $request, Playlist $playlist): JsonResponse
    {
        $this->own($request, $playlist);
        $playlist->shuffleSongs();

        return response()->json($playlist->songs()->get(self::SONG_FIELDS));
    }

    /** Add a search result (`video_id`) or a YouTube / SoundCloud / Spotify link (`url`). */
    public function addSong(Request $request, Playlist $playlist, YouTube $youtube, Music $music): JsonResponse
    {
        $this->own($request, $playlist);
        $data = $request->validate([
            'url' => ['nullable', 'string', 'max:300'],
            'video_id' => ['nullable', 'regex:/^[\w-]{11}$/'],
        ]);

        if (isset($data['video_id'])) {
            $info = $youtube->video($data['video_id']) ?? throw ValidationException::withMessages(['url' => 'Video not found or cannot be embedded.']);
            $songs = [['youtube_id' => $data['video_id'], 'origin' => 'youtube'] + $info];
        } elseif (isset($data['url'])) {
            $spotifyToken = preg_match('~open\.spotify\.com/(?:playlist|album)/~', $data['url']) ? $this->spotifyAccessToken($request) : null;
            $songs = $music->resolve($data['url'], $spotifyToken);
        } else {
            throw ValidationException::withMessages(['url' => 'Paste a link or pick a song.']);
        }

        return response()->json(['added' => $playlist->addSongs($songs), 'found' => count($songs)]);
    }

    /** Import many links at once: one link per line (YouTube playlists are expanded, Spotify playlists need API credentials). */
    public function import(Request $request, Playlist $playlist, Music $music): JsonResponse
    {
        $this->own($request, $playlist);
        $text = $request->validate(['text' => ['required', 'string', 'max:100000']])['text'];

        $spotifyToken = preg_match('~open\.spotify\.com/(?:playlist|album)/~', $text) ? $this->spotifyAccessToken($request) : null;
        [$songs, $errors] = $music->resolveMany($text, $spotifyToken);

        return response()->json(['added' => $playlist->addSongs($songs), 'found' => count($songs), 'errors' => $errors]);
    }

    public function removeSong(Request $request, Playlist $playlist, PlaylistSong $song): JsonResponse
    {
        $this->own($request, $playlist);
        abort_unless($song->playlist_id === $playlist->id, 404);

        $song->delete();

        return response()->json(['ok' => true]);
    }

    private function deckFor(User $user): array
    {
        $active = Playlist::activeFor($user);

        return [
            'lists' => Playlist::where('user_id', $user->id)->where('kind', 'custom')->withCount('songs')->orderBy('name')->get(['id', 'name', 'is_active']),
            'next' => $active?->songs()->first(['id', 'youtube_id', 'title', 'channel', 'thumbnail', 'duration', 'origin']),
        ];
    }

    private function own(Request $request, Playlist $playlist): void
    {
        abort_unless($playlist->user_id === $request->user()->id, 403);
    }

    private function spotifyAccessToken(Request $request): ?string
    {
        $session = $request->session();
        $accessToken = $session->get('spotify.access_token');
        if (is_string($accessToken) && $session->get('spotify.expires_at', 0) > now()->addMinute()->timestamp) {
            return $accessToken;
        }

        $refreshToken = $session->get('spotify.refresh_token');
        if (! is_string($refreshToken) || ! config('services.spotify.client_id') || ! config('services.spotify.client_secret')) {
            return null;
        }

        try {
            $response = Http::timeout(8)->asForm()->withBasicAuth(
                config('services.spotify.client_id'),
                config('services.spotify.client_secret'),
            )->post('https://accounts.spotify.com/api/token', [
                'grant_type' => 'refresh_token',
                'refresh_token' => $refreshToken,
            ]);
        } catch (ConnectionException) {
            return null;
        }

        if (! $response->successful() || ! $response->json('access_token')) {
            $session->forget(['spotify.access_token', 'spotify.refresh_token', 'spotify.expires_at']);

            return null;
        }

        $session->put([
            'spotify.access_token' => $response->json('access_token'),
            'spotify.refresh_token' => $response->json('refresh_token', $refreshToken),
            'spotify.expires_at' => now()->addSeconds((int) $response->json('expires_in', 3600))->timestamp,
        ]);

        return $response->json('access_token');
    }
}
