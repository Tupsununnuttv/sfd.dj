<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Whether people must confirm their email is now a switch of the site (settings: email_verification, Admin panel → Email). It starts as "required", which only counts while the site can really
 * send email (a mail server in .env): until then everybody just gets in, so nobody waits for a message that cannot come.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')->updateOrInsert(['key' => 'email_verification'], ['value' => 'required']);
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'email_verification')->delete();
    }
};
