<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StreamConnectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach (['twitch', 'tiktok'] as $provider) {
            config(["services.{$provider}.client_id" => 'test-client', "services.{$provider}.client_secret" => 'test-secret']);
        }
    }

    private function authorize(string $provider, User $user): string
    {
        $response = $this->actingAs($user)->get(route("{$provider}.connect"))->assertRedirect();
        parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertSame(route("{$provider}.callback"), $query['redirect_uri']);
        $this->assertSame($provider === 'tiktok' ? 'user.info.basic' : '', $query['scope']);

        return $query['state'];
    }

    private function fakeProvider(string $provider, string $id = '123'): void
    {
        Http::fake($provider === 'tiktok' ? [
            'open.tiktokapis.com/v2/oauth/token/' => Http::response(['access_token' => 'private-access', 'refresh_token' => 'private-refresh', 'open_id' => $id, 'expires_in' => 86400]),
            'open.tiktokapis.com/v2/user/info/*' => Http::response(['data' => ['user' => ['open_id' => $id, 'display_name' => 'Test Creator']], 'error' => ['code' => 'ok']]),
        ] : [
            'id.twitch.tv/oauth2/token' => Http::response(['access_token' => 'private-access', 'refresh_token' => 'private-refresh', 'expires_in' => 3600]),
            'api.twitch.tv/helix/users' => Http::response(['data' => [['id' => $id, 'display_name' => 'Test Creator', 'login' => 'test_creator']]]),
        ]);
    }

    public function test_both_accounts_connect_with_encrypted_private_tokens_and_single_use_state(): void
    {
        $user = User::factory()->create();
        foreach (['twitch', 'tiktok'] as $provider) {
            $this->fakeProvider($provider);
            $state = $this->authorize($provider, $user);
            $callback = route("{$provider}.callback", ['state' => $state, 'code' => 'test-code']);
            $this->get($callback)->assertRedirect(route('settings.connections'))->assertSessionHas("{$provider}_notice_ok", true);
            $user->refresh();
            $this->assertSame('123', $user->getAttribute("{$provider}_id"));
            $this->assertSame('private-access', $user->getAttribute("{$provider}_access_token"));
            $this->assertNotSame('private-access', DB::table('users')->where('id', $user->id)->value("{$provider}_access_token"));
            $this->assertArrayNotHasKey("{$provider}_access_token", $user->toArray());
            $this->assertArrayNotHasKey("{$provider}_refresh_token", $user->toArray());
            $this->get(route('settings.connections'))->assertInertia(fn (Assert $page) => $page
                ->where("{$provider}.connected", true)->where("{$provider}.display_name", 'Test Creator')->missing("{$provider}.access_token"));
            $this->get($callback)->assertSessionHas("{$provider}_notice_ok", false);
        }
    }

    public function test_bad_expired_and_wrong_user_states_never_call_the_provider(): void
    {
        $user = User::factory()->create();
        foreach (['twitch', 'tiktok'] as $provider) {
            $state = $this->authorize($provider, $user);
            $this->get(route("{$provider}.callback", ['state' => 'wrong', 'code' => 'code']))->assertSessionHas("{$provider}_notice_ok", false);
            $state = $this->authorize($provider, $user);
            $this->travel(11)->minutes();
            $this->get(route("{$provider}.callback", ['state' => $state, 'code' => 'code']))->assertSessionHas("{$provider}_notice_ok", false);
            $this->travelBack();
            $state = $this->authorize($provider, $user);
            $this->actingAs(User::factory()->create())->get(route("{$provider}.callback", ['state' => $state, 'code' => 'code']))->assertSessionHas("{$provider}_notice_ok", false);
        }
        Http::assertNothingSent();
    }

    public function test_cancellation_and_missing_configuration_do_not_call_the_provider(): void
    {
        $user = User::factory()->create();
        foreach (['twitch', 'tiktok'] as $provider) {
            $state = $this->authorize($provider, $user);
            $this->get(route("{$provider}.callback", ['state' => $state, 'error' => 'access_denied']))->assertSessionHas("{$provider}_notice", 'Account linking was cancelled.');
            config(["services.{$provider}.client_secret" => '']);
            $this->get(route("{$provider}.connect"))->assertRedirect(route('settings.connections'))->assertSessionHas("{$provider}_notice_ok", false);
        }
        Http::assertNothingSent();
    }

    public function test_accounts_cannot_be_claimed_by_a_second_user(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        foreach (['twitch', 'tiktok'] as $provider) {
            $owner->forceFill(["{$provider}_id" => '123'])->save();
            $this->fakeProvider($provider);
            $state = $this->authorize($provider, $other);
            $this->get(route("{$provider}.callback", ['state' => $state, 'code' => 'code']))->assertSessionHas("{$provider}_notice_ok", false);
            $this->assertNull($other->refresh()->getAttribute("{$provider}_id"));
        }
    }

    public function test_provider_failure_does_not_overwrite_a_connection(): void
    {
        $user = User::factory()->create(['twitch_id' => 'old']);
        Http::fake(['id.twitch.tv/oauth2/token' => Http::response(['error' => 'invalid_grant'], 400)]);
        $state = $this->authorize('twitch', $user);
        $this->get(route('twitch.callback', ['state' => $state, 'code' => 'code']))->assertSessionHas('twitch_notice_ok', false);
        $this->assertSame('old', $user->refresh()->twitch_id);
    }

    public function test_disconnect_revokes_and_removes_tokens_even_when_remote_revoke_fails(): void
    {
        $user = User::factory()->create();
        foreach (['twitch', 'tiktok'] as $provider) {
            $user->forceFill(["{$provider}_id" => '123', "{$provider}_access_token" => 'private-access', "{$provider}_refresh_token" => 'private-refresh'])->save();
            Http::fake([
                'id.twitch.tv/oauth2/revoke' => Http::response([], 200),
                'open.tiktokapis.com/v2/oauth/revoke/' => Http::response([], 503),
            ]);
            $this->actingAs($user)->delete(route("{$provider}.disconnect"))->assertRedirect(route('settings.connections'))
                ->assertSessionHas("{$provider}_notice_ok", $provider === 'twitch');
            $user->refresh();
            $this->assertNull($user->getAttribute("{$provider}_id"));
            $this->assertNull($user->getAttribute("{$provider}_access_token"));
            $this->assertNull($user->getAttribute("{$provider}_refresh_token"));
            Http::assertSent(fn ($request) => str_contains($request->url(), $provider === 'twitch' ? '/revoke' : '/oauth/revoke/') && $request['token'] === 'private-access');
        }
    }

    public function test_guests_cannot_connect_or_disconnect_accounts(): void
    {
        foreach (['twitch', 'tiktok'] as $provider) {
            $this->get(route("{$provider}.connect"))->assertRedirect(route('login'));
            $this->get(route("{$provider}.callback"))->assertRedirect(route('login'));
            $this->delete(route("{$provider}.disconnect"))->assertRedirect(route('login'));
        }
    }
}
