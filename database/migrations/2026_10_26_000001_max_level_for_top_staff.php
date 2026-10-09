<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;

/** The Owner, the Developers and the Admins stand at the highest level (100): bring the XP of the ones who are already there up to it. */
return new class extends Migration
{
    public function up(): void
    {
        User::query()->each(function (User $user) {
            if ($user->hasMaxedRole() && (int) $user->xp < User::XP_FOR_MAX_LEVEL) {
                $user->forceFill(['xp' => User::XP_FOR_MAX_LEVEL])->saveQuietly();
            }
        });
    }

    public function down(): void
    {
        // the XP is not taken away again
    }
};
