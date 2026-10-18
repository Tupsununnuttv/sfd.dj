<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\SubscriptionGift;
use App\Models\User;
use App\Support\Plans;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SubscriptionGiftsTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'whsec_gift_test';

    private function gift(User $recipient, array $attributes = []): SubscriptionGift
    {
        return SubscriptionGift::create($attributes + ['sender_id' => User::factory()->create()->id, 'recipient_id' => $recipient->id, 'plan' => 'plus', 'amount' => 999, 'stripe_session_id' => 'cs_gift_'.uniqid()]);
    }

    private function checkoutSession(SubscriptionGift $gift, array $attributes = []): array
    {
        return $attributes + ['id' => $gift->stripe_session_id, 'mode' => 'payment', 'payment_status' => 'paid', 'amount_total' => $gift->amount, 'currency' => 'eur', 'payment_intent' => 'pi_gift_'.$gift->id, 'metadata' => ['kind' => 'subscription_gift', 'gift_id' => (string) $gift->id]];
    }

    private function webhook(array $object, string $type = 'checkout.session.completed', string $secret = self::SECRET)
    {
        config(['services.stripe.webhook_secret' => self::SECRET]);
        $body = json_encode(['type' => $type, 'data' => ['object' => $object]]);
        $time = time();

        return $this->call('POST', '/stripe/webhook', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_STRIPE_SIGNATURE' => "t={$time},v1=".hash_hmac('sha256', "{$time}.{$body}", $secret)], $body);
    }

    public function test_checkout_is_one_payment_at_the_server_price_for_the_selected_member(): void
    {
        config(['services.stripe.secret' => 'sk_test_fake', 'services.stripe.webhook_secret' => self::SECRET]);
        Http::fake(['api.stripe.com/v1/checkout/sessions' => Http::response(['id' => 'cs_gift', 'url' => 'https://checkout.stripe.com/c/pay/cs_gift'])]);
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $this->actingAs($sender)->post('/settings/plus/gifts', ['recipient_id' => $recipient->id, 'plan' => 'premium', 'amount' => 1, 'sender_id' => $recipient->id])
            ->assertRedirect('https://checkout.stripe.com/c/pay/cs_gift');
        $gift = SubscriptionGift::sole();
        $this->assertSame([$sender->id, $recipient->id, 2099, null], [$gift->sender_id, $gift->recipient_id, $gift->amount, $gift->paid_at]);
        Http::assertSent(fn (Request $request) => $request['mode'] === 'payment'
            && $request['line_items'][0]['price_data']['unit_amount'] === Plans::TIERS['premium']['month']
            && ! isset($request['line_items'][0]['price_data']['recurring'])
            && ! isset($request['subscription_data']) && ! isset($request['customer'])
            && $request['customer_email'] === $sender->email
            && $request['metadata']['gift_id'] === $gift->id
            && $request['metadata']['kind'] === 'subscription_gift');
        $this->assertNull($recipient->refresh()->activePlan());
    }

    public function test_gift_checkout_requires_login_valid_recipient_plan_and_complete_payment_configuration(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class);
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        $this->postJson('/settings/plus/gifts', [])->assertUnauthorized();
        foreach ([$sender->id, 999999, User::factory()->create(['is_bot' => true])->id] as $id) {
            $this->actingAs($sender)->postJson('/settings/plus/gifts', ['recipient_id' => $id, 'plan' => 'plus'])->assertUnprocessable()->assertJsonValidationErrors('recipient_id');
        }
        $this->postJson('/settings/plus/gifts', ['recipient_id' => $recipient->id, 'plan' => 'owner'])->assertUnprocessable()->assertJsonValidationErrors('plan');
        config(['services.stripe.secret' => 'sk_test_fake', 'services.stripe.webhook_secret' => null]);
        $this->postJson('/settings/plus/gifts', ['recipient_id' => $recipient->id, 'plan' => 'plus'])->assertUnprocessable()->assertJsonValidationErrors('gift');
        $this->assertDatabaseCount('subscription_gifts', 0);
        Http::assertNothingSent();
    }

    public function test_member_lookup_is_bounded_excludes_self_and_bots_and_never_exposes_email(): void
    {
        $sender = User::factory()->create(['username' => 'alice_sender']);
        User::factory()->create(['username' => 'alice_bot', 'is_bot' => true]);
        $recipient = User::factory()->create(['username' => 'alice_friend', 'name' => 'Alice Friend']);
        $response = $this->actingAs($sender)->getJson('/settings/plus/gifts/recipients?q=alice')->assertOk()->assertJsonCount(1);
        $this->assertSame(['id' => $recipient->id, 'name' => $recipient->name, 'username' => $recipient->username], $response->json()[0]);
        $this->getJson('/settings/plus/gifts/recipients?q=%%')->assertOk()->assertExactJson([]);
    }

    public function test_only_a_signed_matching_paid_session_delivers_a_gift_and_duplicate_delivery_does_not_reset_it(): void
    {
        $recipient = User::factory()->create();
        $gift = $this->gift($recipient);
        $this->webhook($this->checkoutSession($gift), secret: 'wrong')->assertStatus(400);
        foreach ([['id' => 'cs_other'], ['payment_status' => 'unpaid'], ['amount_total' => 1], ['currency' => 'usd'], ['mode' => 'subscription'], ['payment_intent' => null]] as $invalid) {
            $this->webhook($this->checkoutSession($gift, $invalid))->assertNoContent();
            $this->assertNull($gift->refresh()->paid_at);
        }
        $this->webhook($this->checkoutSession($gift), 'checkout.session.async_payment_succeeded')->assertNoContent();
        $this->assertNotNull($paid = $gift->refresh()->paid_at);
        $this->assertNull($recipient->refresh()->activePlan());
        $this->actingAs($recipient)->post('/settings/plus/gifts/'.$gift->id.'/activate')->assertRedirect(route('settings.plus'));
        $end = $gift->refresh()->expires_at;
        $this->travel(1)->days();
        $this->webhook($this->checkoutSession($gift))->assertNoContent();
        $this->assertTrue($gift->refresh()->paid_at->equalTo($paid));
        $this->assertTrue($gift->expires_at->equalTo($end));
    }

    public function test_only_the_recipient_can_activate_and_it_grants_one_month_without_any_billing_fields(): void
    {
        $this->travelTo(now()->setDate(2026, 1, 31)->startOfDay());
        $recipient = User::factory()->create();
        $gift = $this->gift($recipient);
        $this->actingAs($recipient)->postJson('/settings/plus/gifts/'.$gift->id.'/activate')->assertUnprocessable();
        $this->webhook($this->checkoutSession($gift));
        $this->actingAs($gift->sender)->postJson('/settings/plus/gifts/'.$gift->id.'/activate')->assertForbidden();
        $this->actingAs($recipient)->post('/settings/plus/gifts/'.$gift->id.'/activate')->assertRedirect();
        $recipient->refresh();
        $this->assertSame('plus', $recipient->activePlan());
        $this->assertSame(Role::Plus, $recipient->subscriptionRole());
        $this->assertSame(Role::Member, $recipient->role());
        $this->assertSame(200, $recipient->limits()['playlists']);
        $recipient->addXp(100);
        $this->assertSame(125, $recipient->refresh()->xp);
        $this->assertSame('2026-02-28', $gift->refresh()->expires_at->toDateString());
        $this->assertNull($recipient->plan);
        $this->assertNull($recipient->stripe_subscription_id);
        $this->assertFalse((bool) $recipient->plan_renews);
        $this->post('/settings/plus/gifts/'.$gift->id.'/activate')->assertRedirect();
        $this->assertSame('2026-02-28', $gift->refresh()->expires_at->toDateString());
        $this->travelTo($gift->expires_at);
        $this->assertNull($recipient->refresh()->activePlan());
    }

    public function test_a_gift_waits_for_an_existing_subscription_and_never_changes_its_billing(): void
    {
        $recipient = User::factory()->create(['plan' => 'gold', 'plan_until' => now()->addMonth(), 'plan_renews' => true, 'stripe_customer_id' => 'cus_personal', 'stripe_subscription_id' => 'sub_personal']);
        $gift = $this->gift($recipient);
        $this->webhook($this->checkoutSession($gift));
        $this->actingAs($recipient)->postJson('/settings/plus/gifts/'.$gift->id.'/activate')->assertUnprocessable()->assertJsonValidationErrors('gift');
        $this->assertNull($gift->refresh()->activated_at);
        $this->assertSame(['gold', true, 'cus_personal', 'sub_personal'], [$recipient->refresh()->plan, $recipient->plan_renews, $recipient->stripe_customer_id, $recipient->stripe_subscription_id]);
        $recipient->forceFill(['plan_until' => now()->subSecond(), 'plan_renews' => false])->save();
        $this->post('/settings/plus/gifts/'.$gift->id.'/activate')->assertRedirect();
        $this->assertSame('plus', $recipient->refresh()->activePlan());
        $this->assertSame('sub_personal', $recipient->stripe_subscription_id);
    }

    public function test_second_gift_is_saved_until_first_ends_and_higher_paid_plan_always_takes_priority(): void
    {
        $recipient = User::factory()->create();
        $one = $this->gift($recipient);
        $two = $this->gift($recipient, ['plan' => 'premium', 'amount' => 2099]);
        foreach ([$one, $two] as $gift) {
            $this->webhook($this->checkoutSession($gift));
        }
        $this->actingAs($recipient)->post('/settings/plus/gifts/'.$one->id.'/activate')->assertRedirect();
        $this->postJson('/settings/plus/gifts/'.$two->id.'/activate')->assertUnprocessable();
        $this->assertNull($two->refresh()->activated_at);
        $recipient->forceFill(['plan' => 'premium', 'plan_until' => now()->addYear()])->save();
        $this->assertSame('premium', $recipient->refresh()->activePlan());
        $recipient->forceFill(['plan_until' => now()->subSecond()])->save();
        $this->travelTo($one->refresh()->expires_at);
        $this->post('/settings/plus/gifts/'.$two->id.'/activate')->assertRedirect();
        $this->assertSame('premium', $recipient->refresh()->activePlan());
    }

    public function test_history_and_pending_badge_are_private_and_checkout_return_does_not_grant_access(): void
    {
        $recipient = User::factory()->create();
        $gift = $this->gift($recipient);
        $stranger = User::factory()->create();
        $this->actingAs($recipient)->get('/settings/plus?gift_sent=1')->assertOk();
        $this->assertNull($gift->refresh()->paid_at);
        $this->webhook($this->checkoutSession($gift));
        $this->actingAs($recipient)->get('/settings/plus')->assertInertia(fn (Assert $page) => $page
            ->has('receivedGifts', 1)->where('receivedGifts.0.status', 'ready')->where('pendingSubscriptionGifts', 1)
            ->missing('receivedGifts.0.stripe_session_id')->missing('receivedGifts.0.sender.email')->missing('auth.user.activeSubscriptionGifts')->missing('auth.user.active_subscription_gifts'));
        $this->actingAs($stranger)->get('/settings/plus')->assertInertia(fn (Assert $page) => $page->has('receivedGifts', 0)->has('sentGifts', 0)->where('pendingSubscriptionGifts', 0));
    }

    public function test_a_full_refund_or_dispute_revokes_only_the_gift_and_cannot_be_replayed_to_restore_it(): void
    {
        $recipient = User::factory()->create();
        $gift = $this->gift($recipient);
        $this->webhook($this->checkoutSession($gift));
        $this->actingAs($recipient)->post('/settings/plus/gifts/'.$gift->id.'/activate');
        $this->webhook(['payment_intent' => 'pi_gift_'.$gift->id, 'refunded' => false], 'charge.refunded');
        $this->assertSame('plus', $recipient->refresh()->activePlan());
        $this->webhook(['payment_intent' => 'pi_gift_'.$gift->id, 'refunded' => true], 'charge.refunded')->assertNoContent();
        $this->assertNull($recipient->refresh()->activePlan());
        $this->webhook($this->checkoutSession($gift));
        $this->postJson('/settings/plus/gifts/'.$gift->id.'/activate')->assertUnprocessable();
        $recipient->forceFill(['plan' => 'premium', 'plan_until' => now()->addYear(), 'stripe_subscription_id' => 'sub_own'])->save();
        $other = $this->gift($recipient);
        $this->webhook($this->checkoutSession($other));
        $this->webhook(['payment_intent' => 'pi_gift_'.$other->id], 'charge.dispute.created')->assertNoContent();
        $this->assertNotNull($other->refresh()->revoked_at);
        $this->assertSame('premium', $recipient->refresh()->activePlan());
        $this->assertSame('sub_own', $recipient->stripe_subscription_id);
    }

    public function test_provider_failure_shows_a_retryable_error_without_delivering_a_gift(): void
    {
        config(['services.stripe.secret' => 'sk_test_fake', 'services.stripe.webhook_secret' => self::SECRET]);
        Http::fake(['api.stripe.com/v1/checkout/sessions' => Http::response([], 503)]);
        $this->actingAs(User::factory()->create())->postJson('/settings/plus/gifts', ['recipient_id' => User::factory()->create()->id, 'plan' => 'plus'])
            ->assertUnprocessable()->assertJsonValidationErrors('gift');
        $this->assertNull(SubscriptionGift::sole()->paid_at);
    }
}
