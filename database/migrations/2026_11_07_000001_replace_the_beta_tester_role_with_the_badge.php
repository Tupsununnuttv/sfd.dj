<?php

use App\Support\Awards;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The Beta Tester role (with its flask icon) is gone: everybody has the Beta Tester badge instead, also those who signed up after the badges came
 * and only got the role. Bots get no badge; they only lose the role.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->select(['id', 'roles', 'awards', 'is_bot'])->orderBy('id')->chunkById(500, function ($users) {
            foreach ($users as $user) {
                $roles = array_values(array_diff(json_decode($user->roles ?? 'null', true) ?? [], ['beta_tester']));
                $awards = json_decode($user->awards ?? 'null', true) ?? [];
                $awards = $user->is_bot ? Awards::clean($awards) : Awards::clean([...$awards, 'beta']);

                DB::table('users')->where('id', $user->id)->update(['roles' => json_encode($roles), 'awards' => $awards ? json_encode($awards) : null]);
            }
        });
    }

    public function down(): void
    {
        // the role no longer exists in App\Enums\Role, so there is nothing to give back
    }
};
