<?php

namespace App\Http\Controllers;

use App\Events\UserRestrictionsChanged;
use App\Models\Friendship;
use App\Models\User;
use App\Models\UserRestriction;
use App\Models\WhisperCall;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserRestrictionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $me = $request->user()->id;

        return response()->json([
            'state' => UserRestriction::state($me),
            'people' => UserRestriction::where('user_id', $me)->with('target:id,name,username,avatar')->latest()->get()
                ->map(fn ($row) => ['user' => $row->target->only('id', 'name', 'username', 'avatar'), 'blocked' => $row->blocked, 'ignored' => $row->ignored]),
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $me = $request->user()->id;
        abort_if($me === $user->id, 422, 'You cannot block or ignore yourself.');
        $data = $request->validate([
            'blocked' => ['required_without:ignored', 'boolean'],
            'ignored' => ['required_without:blocked', 'boolean'],
        ]);
        DB::transaction(function () use ($me, $user, $data) {
            User::whereKey($me)->lockForUpdate()->firstOrFail();
            $restriction = UserRestriction::firstOrNew(['user_id' => $me, 'target_id' => $user->id]);
            $restriction->fill($data);
            if ($restriction->blocked || $restriction->ignored) {
                $restriction->save();
            } elseif ($restriction->exists) {
                $restriction->delete();
            }
            if ($restriction->blocked) {
                $pair = fn ($q) => $q->where(fn ($p) => $p->where('user_id', $me)->where('friend_id', $user->id))
                    ->orWhere(fn ($p) => $p->where('user_id', $user->id)->where('friend_id', $me));
                Friendship::where('status', 'pending')->where($pair)->delete();
                WhisperCall::whereIn('status', ['ringing', 'active'])->where(fn ($q) => $q
                    ->where(fn ($p) => $p->where('caller_id', $me)->where('callee_id', $user->id))
                    ->orWhere(fn ($p) => $p->where('caller_id', $user->id)->where('callee_id', $me)))
                    ->update(['status' => 'ended', 'offer' => null, 'answer' => null]);
            }
        });
        $state = UserRestriction::state($me);
        UserRestrictionsChanged::dispatch($me, $state);

        return response()->json(['state' => $state]);
    }
}
