<?php

use App\Enums\Role;
use App\Http\Controllers\AvatarController;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Adam & Mochi are for Brand Ambassadors and the roles above them now (AvatarController::ROLE_ONLY), no longer a Common character you buy at level 3. Anybody else who
 * bought them gets the coins back, and anybody else wearing them gets a free character instead.
 */
return new class extends Migration
{
    public function up(): void
    {
        $mayWear = fn (User $user) => AvatarController::holds($user, Role::BrandAmbassador);

        DB::table('user_items')->where('item', 'char:adammochi')->orderBy('id')->get()->each(function (object $bought) use ($mayWear) {
            $user = User::find($bought->user_id);

            if ($user && ! $mayWear($user)) {
                $user->award((int) $bought->price, 'refund', 'Adam & Mochi are for Brand Ambassadors and above now');
                DB::table('user_items')->where('id', $bought->id)->delete();
            }
        });

        User::query()->where('character', 'char:adammochi')->get()->reject($mayWear)
            ->each(fn (User $user) => $user->forceFill(['character' => AvatarController::starterCharacter() ?? 'char:foxy'])->save());
    }

    public function down(): void
    {
        // the coins and the characters stay as they are
    }
};
