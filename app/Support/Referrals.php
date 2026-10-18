<?php

namespace App\Support;

use App\Http\Controllers\CommunityController;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class Referrals
{
    public static function claim(User $member, string $code): void
    {
        DB::transaction(function () use ($member, $code) {
            $inviter = User::where('referral_code', $code)->where('is_bot', false)->first();
            if (! $inviter || $inviter->id === $member->id || $member->is_bot) {
                throw ValidationException::withMessages(['code' => 'Use another member’s valid invite code.']);
            }
            $locked = User::whereIn('id', [$member->id, $inviter->id])->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $recipient = $locked[$member->id];
            $inviter = $locked[$inviter->id];
            if ($recipient->referred_by) {
                throw ValidationException::withMessages(['code' => 'Your account has already used an invite. Each account can use one invite only.']);
            }
            $recipient->forceFill(['referred_by' => $inviter->id])->save();
            $inviter->addXp(CommunityController::REFERRAL_XP);
            if ($inviter->referrals()->count() <= 20) {
                $inviter->award(User::REFERRAL_COINS, 'referral', $recipient->name);
            }
        }, 3);
    }
}
