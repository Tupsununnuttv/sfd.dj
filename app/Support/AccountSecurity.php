<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AccountSecurity
{
    public static function challenge(Request $request, User $user, bool $remember): void
    {
        $request->session()->regenerate(true);
        $request->session()->put([
            'two_factor.id' => $user->id, 'two_factor.remember' => $remember,
            'two_factor.started_at' => now()->timestamp,
            'two_factor.auth_version' => (int) $user->auth_version,
        ]);
    }

    /** Versioned sessions also invalidate file/Redis sessions, without needing to enumerate them. */
    public static function revoke(User $user, ?Request $keep = null, bool $revokeTokens = true): void
    {
        $user->increment('auth_version');
        $user->forceFill(['remember_token' => Str::random(60)])->save();
        if ($revokeTokens) $user->tokens()->delete();
        if (config('session.driver') === 'database') {
            DB::connection(config('session.connection'))->table(config('session.table', 'sessions'))
                ->where('user_id', $user->id)->when($keep, fn ($q) => $q->where('id', '!=', $keep->session()->getId()))->delete();
        }
        if ($keep) {
            $keep->session()->put('auth_version', (int) $user->auth_version);
            $keep->session()->regenerate(true);
            $keep->session()->regenerateToken();
        }
    }
}
