<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SFD-DJ.EU Plus and Premium (App\Support\Plans): which plan someone has and until when (no end: given by staff for good), whether it renews by itself,
 * and their customer and subscription at Stripe when they paid there.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('plan', 16)->nullable();
            $table->timestamp('plan_until')->nullable();
            $table->string('plan_interval', 8)->nullable();
            $table->boolean('plan_renews')->default(false);
            $table->string('stripe_customer_id', 64)->nullable()->index();
            $table->string('stripe_subscription_id', 64)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['stripe_customer_id']);
            $table->dropColumn(['plan', 'plan_until', 'plan_interval', 'plan_renews', 'stripe_customer_id', 'stripe_subscription_id']);
        });
    }
};
