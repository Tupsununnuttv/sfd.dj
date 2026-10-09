<?php

namespace App\Http\Controllers;

use App\Events\WhisperSent;
use App\Models\Friendship;
use App\Models\User;
use App\Models\Whisper;
use App\Support\LinkGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Whispers: private messages between two people. The page and the in-room panel both use the JSON routes. */
class WhisperController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Whispers', [
            'with' => $request->integer('with') ?: null,
            'friends' => $request->user()->friends()->map->only('id', 'name', 'username', 'avatar')->values(),
        ]);
    }

    /** One line per person you have whispered with, newest first. */
    public function conversations(Request $request): JsonResponse
    {
        $me = $request->user()->id;

        $latest = Whisper::where('from_id', $me)->orWhere('to_id', $me)->latest('id')->limit(500)->get()
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
            'messages' => Whisper::between($me, $user->id)->latest('id')->limit(100)->get()->reverse()->map->payload($me)->values(),
        ]);
    }

    /** Send. Address the person by `user_id` or by exact `username` (for the /w command in chat). */
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required_without:username', 'nullable', 'integer'],
            'username' => ['required_without:user_id', 'nullable', 'string', 'max:20'],
            'body' => ['required', 'string', 'max:500'],
        ]);

        $to = isset($data['user_id'])
            ? User::find($data['user_id'])
            : User::whereRaw('lower(username) = ?', [mb_strtolower($data['username'])])->first();

        abort_if(! $to, 422, 'There is nobody with that username.');
        $why = $request->user()->is_staff ? null : LinkGuard::check($data['body']); // not even in a whisper: links to other sites
        abort_if($why !== null, 422, (string) $why);
        abort_if($to->id === $request->user()->id, 422, 'You cannot whisper to yourself.');

        // the receiver decides: everyone, only friends, or nobody (staff can always reach people)
        $mode = $to->pref('privacy.whispers', 'everyone');
        $friends = fn () => Friendship::where('status', 'accepted')->where(fn ($q) => $q->where(['user_id' => $request->user()->id, 'friend_id' => $to->id])->orWhere(fn ($w) => $w->where(['user_id' => $to->id, 'friend_id' => $request->user()->id])))->exists();
        abort_if(! $request->user()->is_staff && ($mode === 'nobody' || ($mode === 'friends' && ! $friends())), 403, "{$to->name} does not take whispers from you.");

        $whisper = Whisper::create(['from_id' => $request->user()->id, 'to_id' => $to->id, 'body' => trim($data['body'])]);
        WhisperSent::dispatch($whisper);

        return response()->json(['message' => $whisper->payload($request->user()->id), 'user' => $to->only('id', 'name', 'username', 'avatar')], 201);
    }
}
