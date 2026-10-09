<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Profile extras (a flag, pronouns, a status, special badges) and two things a room can have of its own: a list of rules and its own CSS.
 * The bio column keeps its size on purpose: SQLite does not look at it, and changing a column on SQLite means rebuilding the whole users table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('country', 8)->nullable();
            $table->string('pronouns', 24)->nullable();
            $table->string('status', 10)->default('online'); // online, busy, away or offline
            $table->json('awards')->nullable();
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->json('rule_list')->nullable(); // [{ title, text }]
            $table->text('custom_css')->nullable();
        });

        // the one block of rules becomes a list: every line is a rule (a short line is a title, a long one the text of a rule)
        DB::table('rooms')->whereNotNull('rules')->where('rules', '!=', '')->get(['id', 'rules'])->each(function ($room) {
            $list = [];

            foreach (preg_split('/\R/', $room->rules) as $line) {
                $line = trim(preg_replace('/^\d+[.)]\s*/', '', trim($line)));

                if ($line !== '') {
                    $list[] = mb_strlen($line) <= 60 ? ['title' => $line, 'text' => ''] : ['title' => 'Rule '.(count($list) + 1), 'text' => mb_substr($line, 0, 500)];
                }
            }

            $list && DB::table('rooms')->where('id', $room->id)->update(['rule_list' => json_encode(array_slice($list, 0, 10))]);
        });

        // everybody who is here before the opening was part of the beta, and the Owner is a founder as well
        DB::table('users')->where('is_bot', false)->update(['awards' => json_encode(['beta'])]);
        DB::table('users')->where('is_bot', false)->whereJsonContains('roles', 'owner')->update(['awards' => json_encode(['beta', 'founder'])]);
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['country', 'pronouns', 'status', 'awards']));
        Schema::table('rooms', fn (Blueprint $table) => $table->dropColumn(['rule_list', 'custom_css']));
    }
};
