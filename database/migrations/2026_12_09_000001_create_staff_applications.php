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
        Schema::create('staff_applications', function (Blueprint $table) {
            $table->id();
            // an application sent from Discord by somebody without an SFD-DJ.EU account has no user
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('source', 16)->default('website');
            $table->string('discord_id', 32)->nullable()->index();
            $table->string('position', 32)->index();
            $table->string('status', 16)->default('pending')->index();
            $table->json('answers');
            $table->text('staff_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reviewer_name', 64)->nullable(); // who decided on Discord, when that person has no account here
            $table->timestamp('reviewed_at')->nullable();
            // "u<user id>" or "d<discord id>" while the application is Pending or Under Review, null once decided: the unique index allows one open application each
            $table->string('open_key', 40)->nullable()->unique();
            $table->string('discord_message_id', 32)->nullable();
            $table->timestamps();
        });

        // whoever answers support conversations reviews applications until the permissions matrix says otherwise
        foreach (DB::table('site_permissions')->where('permission', 'support.manage')->pluck('role')->unique() as $role) {
            SitePermission::firstOrCreate(['role' => $role, 'permission' => 'applications.manage']);
        }
        SitePermission::forget();
    }

    public function down(): void
    {
        DB::table('site_permissions')->where('permission', 'applications.manage')->delete();
        SitePermission::forget();
        Schema::dropIfExists('staff_applications');
    }
};
