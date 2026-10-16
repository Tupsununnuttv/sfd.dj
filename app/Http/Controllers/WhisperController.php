<?php

namespace App\Http\Controllers;

use App\Events\WhisperSent;
use App\Models\User;
use App\Models\Whisper;
use App\Support\LinkGuard;
use App\Support\WordGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Whispers: private messages between two people, or inside a group (see WhisperGroupController). The page and the in-room panel both use the JSON routes. */
class WhisperController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Whispers', [
            'with' => $request->integer('with') ?: null,
            'group' => $request->integer('group') ?: null,
            'friends' => $request->user()->friends()->map->only('id', 'name', 'username', 'avatar')->values(),
        ]);
    }

    /** One line per person you have whispered with, newest first (groups are listed by WhisperGroupController). */
    public function conversations(Request $request): JsonResponse
    {
        $me = $request->user()->id;

        $latest = Whisper::with('replyTo')->whereNull('group_id')->where(fn ($q) => $q->where('from_id', $me)->orWhere('to_id', $me))->latest('id')->limit(500)->get()
            ->groupBy(fn (Whisper $w) => $w->from_id === $me ? $w->to_id : $w->from_id)->take(50);
        $people = User::whereIn('id', $latest->keys())->get(['id', 'name', 'username', 'avatar'])->keyBy('id');
        $unread = Whisper::where('to_id', $me)->whereNull('read_at')->selectRaw('from_id, count(*) as n')->groupBy('from_id')->pluck('n', 'from_id');

        return response()->json($latest->map(fn ($whispers, $other) => [
            'user' => $people[$other]->only('id', 'name', 'username', 'avatar'),
            'last' => $whispers->first()->payload($me),
            'unread' => (int) ($unread[$other] ?? 0),
        ])->values());
    }

    /** The conversation with one person; opening it marks theirs as read. */
    public function thread(Request $request, User $user): JsonResponse
    {
        $me = $request->user()->id;
        Whisper::where('from_id', $user->id)->where('to_id', $me)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json([
            'user' => $user->only('id', 'name', 'username', 'avatar'),
            'messages' => Whisper::with('replyTo')->between($me, $user->id)->latest('id')->limit(100)->get()->reverse()->map->payload($me)->values(),
        ]);
    }

    /** The conversation with this person is on screen: what they wrote is read (the red number in the menu). */
    public function read(Request $request, User $user): HttpResponse
    {
        Whisper::where('from_id', $user->id)->where('to_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->noContent();
    }

    /**
     * Send. Address the person by `user_id` or by exact `username` (for the /w command in chat), or a group you are in by `group_id`. The text may hold emojis and
     * emote tokens (`:7tv:<id>:`); `reply_to_id` answers an earlier whisper of the conversation.
     */
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required_without_all:username,group_id', 'nullable', 'integer'],
            'username' => ['required_without_all:user_id,group_id', 'nullable', 'string', 'max:20'],
            'group_id' => ['nullable', 'integer'],
            'body' => ['required', 'string', 'max:500'],
            'reply_to_id' => ['nullable', 'integer'],
        ]);

        $why = WordGuard::check($data['body']) // never these words, staff included
            ?? ($request->user()->is_staff ? null : LinkGuard::check($data['body'])); // not even in a whisper: links to other sites
        abort_if($why !== null, 422, (string) $why);
        [$to, $conversation, $answer] = $this->destination($request, $data);

        $whisper = Whisper::create(['from_id' => $request->user()->id, 'body' => trim($data['body']), 'reply_to_id' => $this->replyTarget($data, $conversation)] + $to);
        WhisperSent::dispatch($whisper);

        return response()->json(['message' => $whisper->payload($request->user()->id)] + $answer, 201);
    }

    /** Send a voice message: a recording (up to 2 MB and 120 seconds) to a person or a group, addressed like a text whisper. */
    public function voice(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required_without_all:username,group_id', 'nullable', 'integer'],
            'username' => ['required_without_all:user_id,group_id', 'nullable', 'string', 'max:20'],
            'group_id' => ['nullable', 'integer'],
            'audio' => ['required', 'file', 'max:2048', 'mimetypes:'.implode(',', array_keys(Whisper::VOICE_TYPES))],
            'seconds' => ['required', 'integer', 'min:1', 'max:'.Whisper::VOICE_SECONDS],
            'reply_to_id' => ['nullable', 'integer'],
        ]);

        [$to, $conversation, $answer] = $this->destination($request, $data);

        $recording = $request->file('audio');
        $name = bin2hex(random_bytes(12)).'.'.Whisper::VOICE_TYPES[$recording->getMimeType()]; // the type it really is, not what the browser called it
        MediaController::disk()->putFileAs('whispers', $recording, $name);

        $whisper = Whisper::create(['from_id' => $request->user()->id, 'body' => '', 'audio' => $name, 'audio_seconds' => (int) $data['seconds'], 'reply_to_id' => $this->replyTarget($data, $conversation)] + $to);
        WhisperSent::dispatch($whisper);

        return response()->json(['message' => $whisper->payload($request->user()->id)] + $answer, 201);
    }

    /** The recording of a voice message: only the people of the conversation may hear it (of a group: those who were in it when it was sent). */
    public function audio(Request $request, Whisper $whisper): StreamedResponse
    {
        abort_unless($whisper->audio && $this->mayHear($request->user(), $whisper), 404);

        $disk = Storage::disk(config('filesystems.uploads'));
        abort_unless($disk->exists($whisper->audioPath()), 404);

        return $disk->response($whisper->audioPath(), $whisper->audio, [
            'Content-Type' => $whisper->contentType(),
            'Cache-Control' => 'private, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function mayHear(User $user, Whisper $whisper): bool
    {
        return $whisper->group_id
            ? $user->whisperGroups()->whereKey($whisper->group_id)->wherePivot('since_id', '<', $whisper->id)->exists()
            : in_array($user->id, [$whisper->from_id, $whisper->to_id], true);
    }

    /**
     * Where a whisper goes: the columns to store, the whispers of that conversation (what a reply may point at) and what to answer besides the message.
     * A group must be one you are in; a person must take whispers from you.
     */
    private function destination(Request $request, array $data): array
    {
        $me = $request->user();

        if (isset($data['group_id'])) {
            $group = $me->whisperGroups()->whereKey($data['group_id'])->first();
            abort_unless($group, 404);

            return [['group_id' => $group->id], $group->readable(), ['group' => $group->only('id', 'name')]];
        }

        $to = $this->recipient($data);
        $this->mayWhisper($me, $to);

        return [['to_id' => $to->id], Whisper::between($me->id, $to->id), ['user' => $to->only('id', 'name', 'username', 'avatar')]];
    }

    /** A reply must answer a whisper of this very conversation, or it would quote somebody else's; anything else is sent as a plain whisper (as in room chat). */
    private function replyTarget(array $data, $conversation): ?int
    {
        $id = $data['reply_to_id'] ?? null;

        return $id && $conversation->whereKey($id)->exists() ? (int) $id : null;
    }

    /** The person a whisper is for: by `user_id`, or by exact `username` (for the /w command in chat). */
    private function recipient(array $data): User
    {
        $to = isset($data['user_id'])
            ? User::find($data['user_id'])
            : User::whereRaw('lower(username) = ?', [mb_strtolower($data['username'])])->first();

        abort_if(! $to, 422, 'There is nobody with that username.');

        return $to;
    }

    /** Not to yourself, and the receiver decides: everyone, only friends, or nobody (staff can always reach people). */
    private function mayWhisper(User $from, User $to): void
    {
        abort_if($to->id === $from->id, 422, 'You cannot whisper to yourself.');
        abort_if(! $to->takesWhispersFrom($from), 403, "{$to->name} does not take whispers from you.");
    }
}
