<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Donation;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** The Donate button in the room footbar: any amount, paid on Stripe, counted towards the goal and thanked for in the room; and the update check. */
class DonationTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'whsec_test_secret';

    private function webhook(array $event)
    {
        $body = json_encode($event);
        $t = time();

        return $this->call('POST', '/stripe/webhook', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_STRIPE_SIGNATURE' => "t={$t},v1=".hash_hmac('sha256', "{$t}.{$body}", self::SECRET)], $body);
    }

    private function paid(Donation $donation, int $cents): array
    {
        return ['type' => 'checkout.session.completed', 'data' => ['object' => ['id' => 'cs_1', 'payment_status' => 'paid', 'amount_total' => $cents, 'metadata' => ['kind' => 'donation', 'donation_id' => (string) $donation->id]]]];
    }

    public function test_a_donation_of_any_amount_opens_a_stripe_page_that_comes_back_to_the_room(): void
    {
        config(['services.stripe.secret' => 'sk_test_123']);
        Http::fake(['api.stripe.com/v1/checkout/sessions' => Http::response(['id' => 'cs_1', 'url' => 'https://checkout.stripe.com/c/pay/cs_1'])]);
        $me = User::factory()->create();
        $room = $me->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);

        $this->actingAs($me)->postJson('/donations', ['amount' => 0.5])->assertStatus(422);
        $this->actingAs($me)->postJson('/donations', ['amount' => 1001])->assertStatus(422);
        $this->actingAs($me)->postJson('/donations', ['amount' => 7.35, 'anonymous' => true, 'room' => $room->slug])
            ->assertOk()->assertJson(['url' => 'https://checkout.stripe.com/c/pay/cs_1', 'stripe' => true]);

        $donation = Donation::sole();
        $this->assertSame([735, true, $room->id, 'cs_1', null], [$donation->amount, $donation->anonymous, $donation->room_id, $donation->stripe_session_id, $donation->paid_at]);
        Http::assertSent(fn (Request $request) => $request['mode'] === 'payment' && $request['submit_type'] === 'donate'
            && $request['line_items'][0]['price_data']['unit_amount'] === 735 && str_ends_with($request['success_url'], '/rooms/lobby-1?donated=1'));
    }

    public function test_without_stripe_the_donation_page_set_by_staff_opens_or_donations_are_closed(): void
    {
        config(['services.stripe.secret' => null]);
        $me = User::factory()->create();

        $this->actingAs($me)->postJson('/donations', ['amount' => 5])->assertStatus(503);

        Setting::put('donation.url', 'https://ko-fi.com/sfddj');
        $this->actingAs($me)->postJson('/donations', ['amount' => 5])->assertOk()->assertJson(['url' => 'https://ko-fi.com/sfddj', 'stripe' => false]);
        $this->assertSame(0, Donation::count());
    }

    public function test_a_paid_donation_counts_towards_the_goal_and_the_room_says_thank_you_once(): void
    {
        Event::fake([MessageSent::class]);
        config(['services.stripe.webhook_secret' => self::SECRET]);
        Setting::put('donation.enabled', '1');
        Setting::put('donation.goal', '500');
        Setting::put('donation.current', '20'); // raised elsewhere
        $host = User::factory()->create();
        $fan = User::factory()->create(['name' => 'Generous Gina']);
        $room = $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-1']);
        $named = Donation::factory()->create(['user_id' => $fan->id, 'room_id' => $room->id, 'amount' => 2500]);
        $hidden = Donation::factory()->create(['user_id' => $fan->id, 'room_id' => $room->id, 'amount' => 500, 'anonymous' => true]);

        $this->webhook($this->paid($named, 2500))->assertNoContent();
        $this->webhook($this->paid($named, 2500))->assertNoContent(); // Stripe sends it again: counted once
        $this->webhook($this->paid($hidden, 500))->assertNoContent();

        $this->assertSame(['current' => 50.0, 'percent' => 10], array_intersect_key(Setting::community()['donation'], ['current' => 0, 'percent' => 0]));
        $this->assertSame(
            ['Generous Gina donated €25.00 to help SFD-DJ.EU grow. Thank you!', 'Someone donated €5.00 to help SFD-DJ.EU grow. Thank you!'],
            $room->messages()->where('kind', 'donation')->orderBy('id')->pluck('body')->all(),
        );
        $this->assertSame($host->id, $room->messages()->where('body', 'like', 'Someone%')->value('user_id'), 'an anonymous gift does not carry the giver');
    }

    public function test_an_open_page_can_ask_which_build_the_site_runs(): void
    {
        $build = (new HandleInertiaRequests)->version(request()); // the hash of the build's manifest: a new build is a new version

        $this->getJson('/version')->assertOk()->assertExactJson(['version' => $build])->assertHeader('Cache-Control', 'no-store, private');
    }
}
