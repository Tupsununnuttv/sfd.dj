<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WhisperCall;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WhisperCallController extends Controller
{
    private function allowed(User $a, User $b): void
    {
        abort_if($a->id === $b->id || $a->is_bot || $b->is_bot, 422, 'Choose another member to call.');
        abort_unless($b->takesWhispersFrom($a) && $a->takesWhispersFrom($b), 403, 'Whisper privacy settings do not allow this call.');
    }

    private function participant(Request $request, WhisperCall $call): void
    {
        abort_unless(in_array($request->user()->id, [$call->caller_id, $call->callee_id], true), 404);
    }

    private function payload(WhisperCall $call, int $me): array
    {
        return $call->only('id', 'caller_id', 'callee_id', 'video', 'status') + [
            'peer' => User::find($me === $call->caller_id ? $call->callee_id : $call->caller_id)?->only('id', 'name', 'avatar'),
            'offer' => $me === $call->callee_id ? $call->offer : null,
            'answer' => $me === $call->caller_id ? $call->answer : null,
        ];
    }

    public function configuration(Request $request)
    {
        $servers = config('calls.stun_url') ? [['urls' => config('calls.stun_url')]] : [];
        if (config('calls.turn_url') && config('calls.turn_secret')) {
            $username = now()->addHours(2)->timestamp.':'.$request->user()->id;
            $servers[] = ['urls' => config('calls.turn_url'), 'username' => $username,
                'credential' => base64_encode(hash_hmac('sha1', $username, config('calls.turn_secret'), true))];
        }

        return response()->json(['iceServers' => $servers]);
    }

    public function index(Request $request)
    {
        WhisperCall::expire();
        $me = $request->user()->id;
        $call = WhisperCall::whereIn('status', ['ringing', 'active'])->where(fn ($q) => $q->where('caller_id', $me)->orWhere('callee_id', $me))->latest()->first();

        return response()->json(['call' => $call ? $this->payload($call, $me) : null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['user_id' => ['required', 'integer', 'exists:users,id'], 'video' => ['required', 'boolean'], 'offer' => ['required', 'string', 'max:60000', 'starts_with:v=0']]);
        $other = User::findOrFail($data['user_id']);
        $this->allowed($request->user(), $other);
        WhisperCall::expire();
        $call = DB::transaction(function () use ($request, $other, $data) {
            $ids = [$request->user()->id, $other->id];
            User::whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get();
            abort_if(WhisperCall::whereIn('status', ['ringing', 'active'])->where(fn ($q) => $q->whereIn('caller_id', $ids)->orWhereIn('callee_id', $ids))->exists(), 409, 'One of you is already in a call.');

            return WhisperCall::create(['caller_id' => $ids[0], 'callee_id' => $ids[1], 'video' => $data['video'], 'offer' => $data['offer'], 'caller_seen' => now()]);
        });

        return response()->json(['call' => $this->payload($call->refresh(), $request->user()->id)], 201);
    }

    public function update(Request $request, WhisperCall $call)
    {
        $this->participant($request, $call);
        $data = $request->validate(['action' => ['required', 'in:heartbeat,answer,end'], 'answer' => ['required_if:action,answer', 'nullable', 'string', 'max:60000', 'starts_with:v=0']]);
        WhisperCall::expire();
        DB::transaction(function () use ($request, $call, $data) {
            $call = WhisperCall::whereKey($call->id)->lockForUpdate()->firstOrFail();
            if ($data['action'] === 'end') {
                $call->update(['status' => 'ended', 'offer' => null, 'answer' => null]);

                return;
            }
            abort_if($call->status === 'ended', 409, 'This call has ended.');
            if ($data['action'] === 'answer') {
                abort_unless($request->user()->id === $call->callee_id && $call->status === 'ringing', 409);
                $this->allowed(User::findOrFail($call->caller_id), $request->user());
                $call->answer = $data['answer'];
                $call->status = 'active';
            }
            $call->{$request->user()->id === $call->caller_id ? 'caller_seen' : 'callee_seen'} = now();
            $call->save();
        });

        return response()->json(['call' => $this->payload($call->refresh(), $request->user()->id)]);
    }
}
