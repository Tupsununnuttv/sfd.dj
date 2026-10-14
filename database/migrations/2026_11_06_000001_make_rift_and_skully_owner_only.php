<?php

use App\Enums\Role;
use App\Http\Controllers\AvatarController;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Rift and Skully are for the Owner only now (AvatarController::ROLE_ONLY). Anybody else who bought one gets the coins back, and anybody else wearing
 * one gets a free character instead.
 */
return new class extends Migration
{
    private const KEYS = ['char:rift', 'char:skully'];

    public function up(): void
    {
        $isOwner = fn (User $user) => AvatarController::holds($user, Role::Owner);

        DB::table('user_items')->whereIn('item', self::KEYS)->orderBy('id')->get()->each(function (object $bought) use ($isOwner) {
            $user = User::find($bought->user_id);

            if ($user && ! $isOwner($user)) {
                $user->award((int) $bought->price, 'refund', ucfirst(substr($bought->item, 5)).' is for the Owner only now');
                DB::table('user_items')->where('id', $bought->id)->delete();
            }
        });

        User::query()->whereIn('character', self::KEYS)->get()->reject($isOwner)
            ->each(fn (User $user) => $user->forceFill(['character' => AvatarController::starterCharacter() ?? 'char:foxy'])->save());
    }

    public function down(): void
    {
        // the coins and the characters stay as they are
    }
};
