<?php

namespace App\Http\Middleware;

use App\Models\DeviceBan;
use App\Models\UserDevice;
use App\Support\DeviceIdentity;
use App\Support\DiscordActivity;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class CheckDeviceBans
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie(DeviceIdentity::COOKIE);
        if (! is_string($token) || ! preg_match('/\A[a-zA-Z0-9]{64}\z/D', $token)) {
            $token = Str::random(64);
            // inside a Discord Activity (an iframe of discord.com) a Lax cookie is dropped, so every request would be a "new device"
            $activity = DiscordActivity::request($request);
            Cookie::queue(cookie(DeviceIdentity::COOKIE, $token, 60 * 24 * 365, '/', null, $activity || $request->isSecure(), true, false, $activity ? 'none' : 'lax')->withPartitioned($activity));
        }
        $identities = [['kind' => 'browser', 'device_hash' => DeviceIdentity::hash('browser', $token), 'source' => null]];
        if ($windows = DeviceIdentity::windows($request)) {
            $identities[] = $windows;
        }
        $request->attributes->set('sfd_device_hashes', array_column($identities, 'device_hash'));
        abort_if(DeviceBan::where(function ($query) use ($identities) {
            foreach ($identities as $identity) {
                $query->orWhere(fn ($q) => $q->where('kind', $identity['kind'])->where('device_hash', $identity['device_hash']));
            }
        })->exists(), 403, 'This device has been banned from SFD-DJ.EU.');

        if (($user = $request->user()) && ! $user->is_bot) {
            foreach ($identities as $identity) {
                $row = UserDevice::firstOrNew(['user_id' => $user->id, 'kind' => $identity['kind'], 'device_hash' => $identity['device_hash']]);
                if (! $row->exists || $row->ip !== $request->ip() || $row->last_seen_at->lt(now()->subMinutes(2))) {
                    $row->fill(['source' => $identity['source'], 'ip' => $request->ip(), 'last_seen_at' => now()])->save();
                }
            }
        }

        return $next($request);
    }
}
