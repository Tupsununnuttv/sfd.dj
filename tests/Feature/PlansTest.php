<?php

namespace Tests\Feature;

use App\Models\Playlist;
use App\Models\User;
use App\Support\Plans;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** SFD-DJ.EU Plus and Premium: what they give, buying one on Stripe, what Stripe tells us back, and staff giving one by hand. */
class PlansTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'whsec_test_secret';

    private function stripe(): void
    {
        config(['services.stripe.secret' => 'sk_test_123', 'services.stripe.webhook_secret' => self::SECRET]);
    }

    /** A webhook call as Stripe sends it: the body, signed with the endpoint's secret. */
    private function webhook(array $event, ?string $secret = self::SECRET)
    {
        $body = json_encode($event);
        $t = time();

        return $this->call('POST', '/stripe/webhook', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_STRIPE_SIGNATURE' => "t={$t},v1=".hash_hmac('sha256', "{$t}.{$body}", (string) $secret)], $body);
    }

    private function subscription(User $user, string $plan, array $extra = []): array
    {
        $item = ['current_period_end' => now()->addMonth()->timestamp, 'price' => ['recurring' => ['interval' => 'month']]];

        return array_replace(['id' => 'sub_1', 'customer' => 'cus_1', 'status' => 'active', 'cancel_at_period_end' => false, 'metadata' => ['user_id' => (string) $user->id, 'plan' => $plan], 'items' => ['data' => [$item]]], $extra);
    }

    public function test_a_plan_gives_a_gem_more_xp_and_bigger_limits_and_ends_on_its_day(): void
    {
        $me = User::factory()->create();
        $this->assertNull($me->activePlan());
        $this->assertSame(['playlists' => 30, 'songs' => 5000, 'emojis' => 30], $me->limits());

        $me->forceFill(['plan' => 'plus', 'plan_until' => now()->addDays(3)])->save();
        $this->assertSame('plus', $me->refresh()->activePlan());
        $this->assertSame(['playlists' => 60, 'songs' => 10000, 'emojis' => 50], $me->limits());
        $this->assertContains(['key' => 'sub:plus', 'label' => 'SFD-DJ.EU Plus', 'color' => '#2dd4bf', 'icon' => '💎'], $me->badges);
        $me->addXp(100);
        $this->assertSame(125, $me->refresh()->xp);

        // a Plus member makes their 31st playlist, somebody without a plan cannot
        $me->playlists()->createMany(array_map(fn ($i) => ['name' => "List {$i}", 'kind' => 'custom'], range(1, 30)));
        $this->actingAs($me)->postJson('/api/playlists', ['name' => 'One more'])->assertSuccessful();
        $free = User::factory()->create();
        $free->playlists()->createMany(array_map(fn ($i) => ['name' => "List {$i}", 'kind' => 'custom'], range(1, 30)));
        $this->actingAs($free)->postJson('/api/playlists', ['name' => 'One more'])->assertStatus(422);

        // the plan is over: back to Free (the playlists stay)
        $me->forceFill(['plan_until' => now()->subMinute()])->save();
        $this->assertNull($me->refresh()->activePlan());
        $this->assertSame(31, Playlist::where('user_id', $me->id)->count());
        $this->assertNotContains('sub:plus', array_column($me->badges, 'key'));

        // a plan given for good has no end
        $me->forceFill(['plan' => 'premium', 'plan_until' => null])->save();
        $this->assertSame('premium', $me->refresh()->activePlan());
        $this->assertSame(20000, $me->limits()['songs']);
    }

    public function test_the_pages_show_the_plans_and_their_prices(): void
    {
        config(['services.stripe.secret' => null]);
        $this->assertSame('€2.99', Plans::catalog()[0]['month']);
        $this->assertSame('€59.99', Plans::catalog()[1]['year']);

        $this->get('/pricing')->assertInertia(fn (Assert $page) => $page->component('Site/Pricing')->where('plans.0.key', 'plus')->where('plans.1.key', 'premium')->where('plans.0.month', '€2.99')->where('plans.0.year', '€29.99'));

        $me = User::factory()->create();
        $this->actingAs($me)->get('/settings/plus')->assertInertia(fn (Assert $page) => $page->component('Settings/Plus')->where('mine', null)->where('payments', false)->has('plans', 2));
        $this->actingAs($me)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('auth.limits.songs', 5000));
    }

    public function test_buying_goes_to_stripe_checkout_only_when_payments_are_connected(): void
    {
        config(['services.stripe.secret' => null]);
        $me = User::factory()->create();
        $this->actingAs($me)->post('/settings/plus/checkout', ['plan' => 'plus', 'interval' => 'month'])->assertStatus(503);

        $this->stripe();
        Http::fake(['api.stripe.com/v1/checkout/sessions' => Http::response(['id' => 'cs_1', 'url' => 'https://checkout.stripe.com/c/pay/cs_1'])]);

        $this->actingAs($me)->post('/settings/plus/checkout', ['plan' => 'premium', 'interval' => 'year'])->assertRedirect('https://checkout.stripe.com/c/pay/cs_1');
        Http::assertSent(fn (Request $r) => $r->url() === 'https://api.stripe.com/v1/checkout/sessions'
            && $r->hasHeader('Authorization', 'Bearer sk_test_123')
            && $r['mode'] === 'subscription'
            && $r['line_items'][0]['price_data']['unit_amount'] === 5999
            && $r['line_items'][0]['price_data']['recurring']['interval'] === 'year'
            && $r['line_items'][0]['price_data']['currency'] === 'eur'
            && $r['subscription_data']['metadata']['plan'] === 'premium'
            && $r['subscription_data']['metadata']['user_id'] === $me->id
            && $r['customer_email'] === $me->email);

        $this->actingAs($me)->post('/settings/plus/checkout', ['plan' => 'gold', 'interval' => 'month'])->assertSessionHasErrors('plan');
        $this->actingAs($me)->post('/settings/plus/portal')->assertNotFound(); // nothing to manage yet
    }

    public function test_stripe_tells_us_about_the_plan_bought_cancelled_and_ended_and_unsigned_calls_do_nothing(): void
    {
        $this->stripe();
        $me = User::factory()->create();

        $this->webhook(['type' => 'customer.subscription.created', 'data' => ['object' => $this->subscription($me, 'plus')]], 'whsec_wrong')->assertStatus(400);
        $this->assertNull($me->refresh()->activePlan());

        $this->webhook(['type' => 'customer.subscription.created', 'data' => ['object' => $this->subscription($me, 'plus')]])->assertNoContent();
        $me->refresh();
        $this->assertSame('plus', $me->activePlan());
        $this->assertTrue($me->plan_renews);
        $this->assertSame('month', $me->plan_interval);
        $this->assertSame('cus_1', $me->stripe_customer_id);
        $this->assertEqualsWithDelta(now()->addMonth()->timestamp, $me->plan_until->timestamp, 5);
        $this->actingAs($me)->get('/settings/plus')->assertInertia(fn (Assert $page) => $page->where('mine.key', 'plus')->where('mine.renews', true)->where('manageable', true));

        // cancelled: kept until the end of the paid month, no renewing
        $this->webhook(['type' => 'customer.subscription.updated', 'data' => ['object' => $this->subscription($me, 'plus', ['cancel_at_period_end' => true])]])->assertNoContent();
        $this->assertSame('plus', $me->refresh()->activePlan());
        $this->assertFalse($me->plan_renews);

        // Stripe's billing page: only for somebody who paid there
        Http::fake(['api.stripe.com/v1/billing_portal/sessions' => Http::response(['url' => 'https://billing.stripe.com/p/session/x'])]);
        $this->actingAs($me)->post('/settings/plus/portal')->assertRedirect('https://billing.stripe.com/p/session/x');

        // the subscription ended
        $this->webhook(['type' => 'customer.subscription.deleted', 'data' => ['object' => $this->subscription($me, 'plus', ['status' => 'canceled'])]])->assertNoContent();
        $this->assertNull($me->refresh()->activePlan());
    }

    public function test_admin_overview_reports_stripe_api_and_webhook_health(): void
    {
        $admin = User::factory()->create(['roles' => ['owner']]); // the Stripe lines are for the Owner alone
        config(['services.stripe.secret' => 'not-a-real-stripe-key', 'services.stripe.webhook_secret' => self::SECRET]);
        Http::fakeSequence('api.stripe.com/v1/account')
            ->push(['id' => 'acct_test'], 200)
            ->push([], 401);

        $this->actingAs($admin)->get('/admin')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('overview.health.6.0', 'Stripe API (subscriptions)')
            ->where('overview.health.6.1', 'ok')
            ->where('overview.health.7.0', 'Stripe webhook')
            ->where('overview.health.7.1', 'ok'));

        Http::assertSent(fn (Request $request) => $request->url() === 'https://api.stripe.com/v1/account'
            && $request->hasHeader('Authorization', 'Bearer not-a-real-stripe-key'));

        $this->actingAs($admin)->get('/admin')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('overview.health.6.1', 'warn')
            ->where('overview.health.6.2', 'Stripe rejected STRIPE_SECRET. Check that it is current and belongs to this environment.'));

        config(['services.stripe.secret' => null, 'services.stripe.webhook_secret' => null]);
        Http::fake();

        $this->actingAs($admin)->get('/admin')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('overview.health.6.1', 'warn')
            ->where('overview.health.7.1', 'warn'));
    }

    public function test_staff_give_and_take_a_plan_by_hand(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['roles' => ['admin']])->save();
        $plain = User::factory()->create();

        $this->actingAs($plain)->patch("/admin/users/{$admin->id}/plan", ['plan' => 'plus', 'months' => 1])->assertForbidden();

        $this->actingAs($admin)->patch("/admin/users/{$plain->id}/plan", ['plan' => 'plus', 'months' => 1])->assertRedirect();
        $this->assertSame('plus', $plain->refresh()->activePlan());
        $this->assertEqualsWithDelta(now()->addMonth()->timestamp, $plain->plan_until->timestamp, 5);

        $this->actingAs($admin)->patch("/admin/users/{$plain->id}/plan", ['plan' => 'premium', 'months' => 0])->assertRedirect();
        $this->assertSame('premium', $plain->refresh()->activePlan());
        $this->assertNull($plain->plan_until); // for good

        $this->actingAs($admin)->get('/admin?q='.$plain->username)->assertInertia(fn (Assert $page) => $page->where('users.data.0.plan', 'premium')->where('users.data.0.plan_until', null)->has('planList', 2));

        $this->actingAs($admin)->patch("/admin/users/{$plain->id}/plan", ['plan' => null])->assertRedirect();
        $this->assertNull($plain->refresh()->activePlan());
    }
}
