<?php

use App\Enums\Role;
use App\Http\Controllers\AvatarController;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Skelly, the skeleton developer, is for the Owner only now (AvatarController::ROLE_ONLY). Anybody else who bought him gets the coins back, and anybody else
 * wearing him gets a free character instead.
 */
return new class extends Migration
{
    public function up(): void
    {
        $isOwner = fn (User $user) => AvatarController::holds($user, Role::Owner);

        DB::table('user_items')->where('item', 'char:skelly')->orderBy('id')->get()->each(function (object $bought) use ($isOwner) {
            $user = User::find($bought->user_id);

            if ($user && ! $isOwner($user)) {
                $user->award((int) $bought->price, 'refund', 'Skelly is for the Owner only now');
                DB::table('user_items')->where('id', $bought->id)->delete();
            }
        });

        User::query()->where('character', 'char:skelly')->get()->reject($isOwner)
            ->each(fn (User $user) => $user->forceFill(['character' => AvatarController::starterCharacter() ?? 'char:skellyy'])->save());
    }

    public function down(): void
    {
        // the coins and the characters stay as they are
    }
};
