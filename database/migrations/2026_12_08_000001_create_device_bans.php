<?php

use App\Models\SitePermission;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 16);
            $table->string('source', 16)->nullable();
            $table->char('device_hash', 64)->index();
            $table->string('ip', 45)->nullable()->index();
            $table->timestamp('last_seen_at')->index();
            $table->timestamps();
            $table->unique(['user_id', 'kind', 'device_hash']);
        });
        Schema::create('device_bans', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 16);
            $table->char('device_hash', 64);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('banned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason', 200);
            $table->timestamps();
            $table->unique(['kind', 'device_hash']);
        });
        Schema::create('access_ban_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('target_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 32);
            $table->string('reason', 200)->nullable();
            $table->timestamps();
        });
        foreach (DB::table('site_permissions')->where('permission', 'ipbans.manage')->pluck('role')->unique() as $role) {
            SitePermission::firstOrCreate(['role' => $role, 'permission' => 'devicebans.manage']);
        }
        SitePermission::forget();
    }

    public function down(): void
    {
        DB::table('site_permissions')->where('permission', 'devicebans.manage')->delete();
        SitePermission::forget();
        Schema::dropIfExists('access_ban_logs');
        Schema::dropIfExists('device_bans');
        Schema::dropIfExists('user_devices');
    }
};
