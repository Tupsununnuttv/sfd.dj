<?php

namespace App\Http\Controllers;

use App\Models\DeviceBan;
use App\Models\IpBan;
use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Global site moderation, independent of room roles and room release schedules. */
class UserAccessController extends Controller
{
    public function show(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor->hasPermission('ipbans.manage') || $actor->hasPermission('devicebans.manage'), 403);
        if ($actor->id === $user->id || ! $actor->outranks($user) || $user->is_bot) {
            return response()->json(['allowed' => false])->header('Cache-Control', 'private, no-store');
        }
        $ip = $actor->hasPermission('ipbans.manage') ? $this->latestIp($user) : null;
        $devices = $actor->hasPermission('devicebans.manage') ? UserDevice::where('user_id', $user->id)->orderByDesc('last_seen_at')->orderByDesc('id')->limit(30)->get() : collect();
        $bans = DeviceBan::whereIn('device_hash', $devices->pluck('device_hash'))->get()->keyBy(fn ($ban) => $ban->kind.':'.$ban->device_hash);

        return response()->json([
            'allowed' => true,
            'ip' => $ip,
            'ip_ban_id' => $ip ? IpBan::where('ip', $ip)->value('id') : null,
            'devices' => $devices->map(fn ($device) => [
                'id' => $device->id, 'kind' => $device->kind, 'source' => $device->source,
                'last_seen_at' => $device->last_seen_at->toIso8601String(),
                'ban_id' => $bans->get($device->kind.':'.$device->device_hash)?->id,
            ]),
        ])->header('Cache-Control', 'private, no-store');
    }

    public function banIp(Request $request, User $user): JsonResponse
    {
        $actor = $this->allow($request, $user, 'ipbans.manage');
        $data = $request->validate(['ip' => ['required', 'ip'], 'reason' => ['required', 'string', 'min:3', 'max:200']]);
        DB::transaction(function () use ($request, $user, $actor, $data) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            abort_unless($data['ip'] === $this->latestIp($user), 422, 'The user address changed. Reload the moderation details before banning.');
            abort_if($data['ip'] === $request->ip(), 422, 'You cannot ban your own IP address.');
            $ids = UserDevice::where('ip', $data['ip'])->pluck('user_id')->merge(DB::table('sessions')->where('ip_address', $data['ip'])->whereNotNull('user_id')->pluck('user_id'))->unique();
            abort_if(User::whereIn('id', $ids)->get()->contains(fn ($other) => ! $actor->outranks($other)), 422, 'A protected account uses this IP address.');
            IpBan::firstOrCreate(['ip' => $data['ip']], ['reason' => $data['reason'], 'banned_by' => $actor->id]);
            $this->audit($actor->id, $user->id, 'ip_ban', $data['reason']);
        });

        return response()->json(['saved' => true]);
    }

    public function banDevice(Request $request, User $user): JsonResponse
    {
        $actor = $this->allow($request, $user, 'devicebans.manage');
        $data = $request->validate(['device_id' => ['required', 'integer'], 'reason' => ['required', 'string', 'min:3', 'max:200']]);
        DB::transaction(function () use ($request, $user, $actor, $data) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $device = UserDevice::where('user_id', $user->id)->whereKey($data['device_id'])->firstOrFail();
            abort_if(in_array($device->device_hash, $request->attributes->get('sfd_device_hashes', []), true), 422, 'You cannot ban your own device.');
            $ids = UserDevice::where('kind', $device->kind)->where('device_hash', $device->device_hash)->pluck('user_id');
            abort_if(User::whereIn('id', $ids)->get()->contains(fn ($other) => ! $actor->outranks($other)), 422, 'A protected account uses this device.');
            DeviceBan::firstOrCreate(['kind' => $device->kind, 'device_hash' => $device->device_hash], ['user_id' => $user->id, 'banned_by' => $actor->id, 'reason' => $data['reason']]);
            $this->audit($actor->id, $user->id, 'device_ban', $data['reason']);
        });

        return response()->json(['saved' => true]);
    }

    public function unbanDevice(Request $request, DeviceBan $deviceBan): JsonResponse
    {
        abort_unless($request->user()->hasPermission('devicebans.manage'), 403);
        $this->audit($request->user()->id, $deviceBan->user_id, 'device_unban', $deviceBan->reason);
        $deviceBan->delete();

        return response()->json(['saved' => true]);
    }

    private function allow(Request $request, User $target, string $permission): User
    {
        $actor = $request->user();
        abort_unless($actor->hasPermission($permission) && $actor->id !== $target->id && $actor->outranks($target) && ! $target->is_bot, 403);

        return $actor;
    }

    private function latestIp(User $user): ?string
    {
        return UserDevice::where('user_id', $user->id)->whereNotNull('ip')->orderByDesc('last_seen_at')->orderByDesc('id')->value('ip')
            ?? DB::table('sessions')->where('user_id', $user->id)->whereNotNull('ip_address')->orderByDesc('last_activity')->value('ip_address');
    }

    private function audit(int $actor, ?int $target, string $action, ?string $reason): void
    {
        DB::table('access_ban_logs')->insert(['actor_id' => $actor, 'target_id' => $target, 'action' => $action, 'reason' => $reason, 'created_at' => now(), 'updated_at' => now()]);
    }
}
