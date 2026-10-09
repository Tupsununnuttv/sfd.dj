<?php

use App\Enums\Role;
use App\Models\Room;
use App\Models\SitePermission;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('friendships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();   // who sent the request
            $table->foreignId('friend_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 10)->default('pending');                  // pending | accepted
            $table->timestamps();

            $table->unique(['user_id', 'friend_id']);
        });

        Schema::create('room_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->string('name', 30);
            $table->string('color', 16)->default('#a3a3a3');
            $table->unsignedInteger('rank')->default(10);
            $table->json('permissions');
            $table->boolean('builtin')->default(false);
            $table->timestamps();
        });

        Schema::create('room_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_role_id')->constrained('room_roles')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['room_id', 'user_id']);
        });

        Schema::create('site_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role', 32);
            $table->string('permission', 32);

            $table->unique(['role', 'permission']);
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
        });

        Schema::create('ip_bans', function (Blueprint $table) {
            $table->id();
            $table->string('ip', 45)->unique();
            $table->string('reason')->nullable();
            $table->foreignId('banned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('message', 500);
            $table->string('level', 10)->default('info'); // info | warning
            $table->timestamps();
        });

        Schema::create('violations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason');
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->json('preferences')->nullable();
        });

        foreach (Role::defaultPermissions() as $role => $permissions) {
            foreach ($permissions as $permission) {
                SitePermission::create(['role' => $role, 'permission' => $permission]);
            }
        }

        Room::each(fn (Room $room) => $room->ensureDefaultRoles());
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('preferences'));

        foreach (['violations', 'announcements', 'ip_bans', 'settings', 'site_permissions', 'room_members', 'room_roles', 'friendships'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
