<?php

namespace Tests\Feature;

use App\Http\Controllers\SocialConnectionController;
use App\Models\SocialConnection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SocialConnectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach (SocialConnectionController::PROVIDERS as $provider) config(["services.{$provider}.client_id" => 'test-client', "services.{$provider}.client_secret" => 'test-secret']);
    }

    private function authorize(string $provider, User $user): array
    {
        $response = $this->actingAs($user)->get(route("{$provider}.connect"))->assertRedirect();
        parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $parameters);
        $this->assertSame(route("{$provider}.callback"), $parameters['redirect_uri']);

        return $parameters;
    }

    private function fakeProvider(string $provider): void
    {
        $token = ['access_token' => 'private-access', 'refresh_token' => 'private-refresh', 'expires_in' => 7200];
        Http::fake(match ($provider) {
            'reddit' => ['www.reddit.com/api/v1/access_token' => Http::response($token), 'oauth.reddit.com/api/v1/me' => Http::response(['id' => '123', 'name' => 'test_person'])],
            'instagram' => ['api.instagram.com/oauth/access_token' => Http::response($token + ['user_id' => 123]), 'graph.instagram.com/me*' => Http::response(['user_id' => '123', 'username' => 'test_person'])],
            'facebook' => ['graph.facebook.com/*/oauth/access_token*' => Http::response($token), 'graph.facebook.com/*/me*' => Http::response(['id' => '123', 'name' => 'Test Person'])],
            'x' => ['api.x.com/2/oauth2/token' => Http::response($token), 'api.x.com/2/users/me' => Http::response(['data' => ['id' => '123', 'username' => 'test_person', 'name' => 'Test Person']])],
        });
    }

    public function test_all_four_services_link_with_private_encrypted_tokens_and_safe_settings_props(): void
    {
        $user = User::factory()->create();
        foreach (SocialConnectionController::PROVIDERS as $provider) {
            $this->fakeProvider($provider);
            $auth = $this->authorize($provider, $user);
            $this->get(route("{$provider}.callback", ['state' => $auth['state'], 'code' => 'valid-code']))->assertRedirect(route('settings.connections'))->assertSessionHas("{$provider}_notice_ok", true);
            $connection = SocialConnection::where('provider', $provider)->firstOrFail();
            $this->assertSame($user->id, $connection->user_id);
            $this->assertSame('private-access', $connection->access_token);
            $this->assertSame('private-refresh', $connection->refresh_token);
            $raw = DB::table('social_connections')->where('id', $connection->id)->first();
            $this->assertNotSame('private-access', $raw->access_token);
            $this->assertArrayNotHasKey('access_token', $connection->toArray());
        }
        $response = $this->get('/settings/connections')->assertOk();
        foreach (SocialConnectionController::PROVIDERS as $provider) $this->assertTrue($response->inertiaProps("social.{$provider}.connected"));
        $this->assertStringNotContainsString('private-access', $response->getContent());
        $this->assertStringNotContainsString('test-secret', $response->getContent());
    }

    public function test_x_uses_s256_pkce_and_other_providers_request_only_linking_scopes(): void
    {
        $user = User::factory()->create();
        $parameters = $this->authorize('x', $user);
        $this->assertSame('S256', $parameters['code_challenge_method']);
        $verifier = session('x_oauth.verifier');
        $this->assertSame(rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '='), $parameters['code_challenge']);
        $this->fakeProvider('x');
        $this->get(route('x.callback', ['state' => $parameters['state'], 'code' => 'valid']))->assertSessionHas('x_notice_ok', true);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/oauth2/token') && $request['code_verifier'] === $verifier);
        $this->assertSame('identity', $this->authorize('reddit', $user)['scope']);
        $this->assertSame('instagram_business_basic', $this->authorize('instagram', $user)['scope']);
        $this->assertSame('public_profile', $this->authorize('facebook', $user)['scope']);
    }

    public function test_forged_expired_and_different_user_callbacks_never_contact_providers(): void
    {
        Http::fake();
        $first = User::factory()->create();
        $second = User::factory()->create();
        $auth = $this->authorize('reddit', $first);
        $this->get(route('reddit.callback', ['state' => 'forged', 'code' => 'code']))->assertSessionHas('reddit_notice_ok', false);
        $this->get(route('reddit.callback', ['state' => $auth['state'], 'code' => 'code']))->assertSessionHas('reddit_notice_ok', false);
        $auth = $this->authorize('facebook', $first);
        $this->actingAs($second)->get(route('facebook.callback', ['state' => $auth['state'], 'code' => 'code']))->assertSessionHas('facebook_notice_ok', false);
        $auth = $this->authorize('instagram', $first);
        $this->travel(11)->minutes();
        $this->get(route('instagram.callback', ['state' => $auth['state'], 'code' => 'code']))->assertSessionHas('instagram_notice_ok', false);
        Http::assertNothingSent();
        $this->assertSame(0, SocialConnection::count());
    }

    public function test_an_external_account_cannot_be_claimed_by_two_site_users(): void
    {
        $this->fakeProvider('reddit');
        $first = User::factory()->create();
        $auth = $this->authorize('reddit', $first);
        $this->get(route('reddit.callback', ['state' => $auth['state'], 'code' => 'code']))->assertSessionHas('reddit_notice_ok', true);
        $second = User::factory()->create();
        $auth = $this->authorize('reddit', $second);
        $this->get(route('reddit.callback', ['state' => $auth['state'], 'code' => 'code']))->assertSessionHas('reddit_notice_ok', false);
        $this->assertSame(1, SocialConnection::count());
        $this->assertSame($first->id, SocialConnection::first()->user_id);
    }

    public function test_disconnect_revokes_both_tokens_and_removes_only_the_current_users_connection(): void
    {
        $this->fakeProvider('x');
        $user = User::factory()->create();
        $auth = $this->authorize('x', $user);
        $this->get(route('x.callback', ['state' => $auth['state'], 'code' => 'code']));
        Http::fake(['api.x.com/2/oauth2/revoke' => Http::response([])]);
        $this->delete(route('x.disconnect'))->assertSessionHas('x_notice_ok', true);
        $this->assertSame(0, SocialConnection::count());
        Http::assertSent(fn ($request) => $request['token'] === 'private-access' && $request['token_type_hint'] === 'access_token');
        Http::assertSent(fn ($request) => $request['token'] === 'private-refresh' && $request['token_type_hint'] === 'refresh_token');
        $this->get(route('x.callback', ['state' => $auth['state'], 'code' => 'code']))->assertSessionHas('x_notice_ok', false);
    }

    public function test_unconfigured_services_do_not_start_oauth_or_replace_existing_connections(): void
    {
        Http::fake();
        $user = User::factory()->create();
        config(['services.reddit.client_secret' => null]);
        $this->actingAs($user)->get(route('reddit.connect'))->assertRedirect(route('settings.connections'))->assertSessionHas('reddit_notice_ok', false);
        $this->assertNull(session('reddit_oauth'));
        Http::assertNothingSent();
    }

    public function test_malformed_token_responses_do_not_create_accounts_or_request_profiles(): void
    {
        $user = User::factory()->create();
        foreach (SocialConnectionController::PROVIDERS as $provider) {
            Http::fake(['*' => Http::response($provider === 'instagram' ? ['data' => [null]] : ['access_token' => ['invalid']], 200)]);
            $auth = $this->authorize($provider, $user);
            $this->get(route("{$provider}.callback", ['state' => $auth['state'], 'code' => 'code']))->assertSessionHas("{$provider}_notice_ok", false);
            Http::assertSentCount(1);
        }
        Http::fake(['*' => Http::response(['data' => ['unexpected' => []]], 200)]);
        $auth = $this->authorize('instagram', $user);
        $this->get(route('instagram.callback', ['state' => $auth['state'], 'code' => 'code']))->assertSessionHas('instagram_notice_ok', false);
        $this->assertSame(0, SocialConnection::count());
    }

    public function test_failed_remote_revocation_still_removes_local_tokens_and_explains_the_remaining_step(): void
    {
        $user = User::factory()->create();
        $this->fakeProvider('facebook');
        $auth = $this->authorize('facebook', $user);
        $this->get(route('facebook.callback', ['state' => $auth['state'], 'code' => 'code']));
        Http::fake(['*' => Http::response(['error' => 'unavailable'], 503)]);
        $this->delete(route('facebook.disconnect'))->assertSessionHas('facebook_notice_ok', false)
            ->assertSessionHas('facebook_notice', fn ($notice) => str_contains($notice, 'disconnected locally'));
        $this->assertSame(0, SocialConnection::count());
    }
}
