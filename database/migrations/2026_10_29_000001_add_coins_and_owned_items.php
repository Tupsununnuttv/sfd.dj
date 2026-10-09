<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * SFD Coins: a balance on every user, a ledger of every coin that came or went, and the things people bought in the Avatar shop.
 * Everybody who is here already gets what they would have earned by now (100 to start and the coins of every level they climbed) and keeps what they wear.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('coins')->default(0);
            $table->date('daily_coins_on')->nullable(); // the day the daily coins were last taken
        });

        Schema::create('user_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('slot', 12); // avatar, badge, accessory, frame or effect
            $table->string('item', 40);
            $table->unsignedInteger('price')->default(0); // what it cost them
            $table->timestamps();
            $table->unique(['user_id', 'slot', 'item']);
        });

        Schema::create('coin_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('amount'); // plus when coins came, minus when they went
            $table->unsignedInteger('balance'); // what they had after it
            $table->string('reason', 16);
            $table->string('note', 120)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->index(['user_id', 'id']);
        });

        $staff = ['owner', 'developer', 'admin']; // their level is fixed at the top, it was not earned: they get the 100 and nothing more

        DB::table('users')->get(['id', 'xp', 'roles', 'avatar', 'cosmetics'])->each(function ($user) use ($staff) {
            $level = min(100, (int) floor(sqrt(($user->xp ?? 0) / 20)) + 1);
            $isStaff = array_intersect($staff, json_decode((string) $user->roles, true) ?: []) !== [];
            $coins = 100 + ($isStaff ? 0 : 10 * (intdiv($level * ($level + 1), 2) - 1)); // 10 * (2 + 3 + ... + level)
            $now = now();

            DB::table('users')->where('id', $user->id)->update(['coins' => $coins]);
            DB::table('coin_transactions')->insert(['user_id' => $user->id, 'amount' => $coins, 'balance' => $coins, 'reason' => 'welcome', 'note' => 'SFD Coins are here', 'created_at' => $now]);

            // what they wear is theirs
            $worn = collect(json_decode((string) $user->cosmetics, true) ?: [])->map(fn ($key, $slot) => ['slot' => $slot, 'item' => $key]);
            if (str_starts_with((string) $user->avatar, 'char:')) {
                $worn->push(['slot' => 'avatar', 'item' => $user->avatar]);
            }
            $worn->each(fn ($row) => DB::table('user_items')->insertOrIgnore($row + ['user_id' => $user->id, 'price' => 0, 'created_at' => $now, 'updated_at' => $now]));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coin_transactions');
        Schema::dropIfExists('user_items');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['coins', 'daily_coins_on']);
        });
    }
};
