<?php

namespace App\Http\Controllers;

use App\Models\Playlist;
use App\Models\PlaylistSong;
use App\Models\User;
use App\Services\Music;
use App\Services\YouTube;
use App\Support\Plans;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            $songs = $music->resolve($data['url'], $request->user());
        } else {
            throw ValidationException::withMessages(['url' => 'Paste a link or pick a song.']);
        }

        return response()->json(['added' => $playlist->addSongs($songs), 'found' => count($songs)]);
    }

    /** Import many links at once: one link per line. YouTube playlists and Spotify playlists accessible to the user are expanded. */
    public function import(Request $request, Playlist $playlist, Music $music): JsonResponse
    {
        $this->own($request, $playlist);
        $text = $request->validate(['text' => ['required', 'string', 'max:100000']])['text'];

        [$songs, $errors] = $music->resolveMany($text, $request->user());

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
}
