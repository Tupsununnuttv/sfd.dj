<?php

use App\Models\SitePermission;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** The staff roles that review applications (the Owner has every permission anyway). */
    private const REVIEWERS = ['developer', 'admin', 'lead_moderator', 'brand_ambassador', 'site_moderator', 'moderator'];

    public function up(): void
    {
        // the conversation between staff and the applicant under one application
        Schema::create('staff_application_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('from_staff');
            $table->text('body');
            $table->timestamps();
        });

        // only the staff roles review applications: until now whoever had support.manage did
        SitePermission::where('permission', 'applications.manage')->whereNotIn('role', self::REVIEWERS)->delete();
        foreach (self::REVIEWERS as $role) {
            SitePermission::firstOrCreate(['role' => $role, 'permission' => 'applications.manage']);
        }
        SitePermission::forget();
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_application_messages');
    }
};
