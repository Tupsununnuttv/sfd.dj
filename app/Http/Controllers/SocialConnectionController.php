<?php

namespace App\Http\Controllers;

use App\Models\SocialConnection;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/** Account linking only: never signs in a site user or requests publishing/message permissions. */
class SocialConnectionController extends Controller
{
    public const PROVIDERS = ['reddit', 'instagram', 'facebook', 'x'];

    private const SCOPES = ['reddit' => 'identity', 'instagram' => 'instagram_business_basic', 'facebook' => 'public_profile', 'x' => 'users.read tweet.read offline.access'];

    public static function configured(string $provider): bool
    {
        return in_array($provider, self::PROVIDERS, true) && filled(config("services.{$provider}.client_id")) && filled(config("services.{$provider}.client_secret"));
    }

    private function client(string $provider): PendingRequest
    {
        $client = Http::acceptJson()->connectTimeout(3)->timeout(10)->withoutRedirecting();
        if ($provider === 'reddit') {
            $client = $client->withUserAgent(config('services.reddit.user_agent', 'web:SFD-DJ.EU:1.0 (account linking)'));
        }

        return $client;
    }

    private function graphVersion(): string
    {
        $version = config('services.facebook.graph_version', 'v25.0');

        return is_string($version) && preg_match('/^v\d{1,2}\.\d$/', $version) ? $version : 'v25.0';
    }

    public function connect(Request $request, string $provider): RedirectResponse
    {
        abort_unless(in_array($provider, self::PROVIDERS, true), 404);
        if (! self::configured($provider)) return $this->back($provider, 'Account linking is not configured on this site yet.');
        $state = Str::random(48);
        $verifier = Str::random(64);
        $request->session()->put("{$provider}_oauth", ['state' => $state, 'verifier' => $verifier, 'user_id' => $request->user()->id, 'expires' => now()->addMinutes(10)->timestamp]);
        $parameters = ['client_id' => config("services.{$provider}.client_id"), 'redirect_uri' => route("{$provider}.callback"), 'response_type' => 'code', 'scope' => self::SCOPES[$provider], 'state' => $state];
        if ($provider === 'reddit') $parameters['duration'] = 'permanent';
        if ($provider === 'x') {
            $parameters += ['code_challenge' => rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '='), 'code_challenge_method' => 'S256'];
        }
        $url = match ($provider) {
            'reddit' => 'https://www.reddit.com/api/v1/authorize',
            'instagram' => 'https://www.instagram.com/oauth/authorize',
            'facebook' => 'https://www.facebook.com/'.$this->graphVersion().'/dialog/oauth',
            'x' => 'https://x.com/i/oauth2/authorize',
        };

        return redirect()->away($url.'?'.http_build_query($parameters));
    }

    public function callback(Request $request, string $provider): RedirectResponse
    {
        abort_unless(in_array($provider, self::PROVIDERS, true), 404);
        $pending = $request->session()->pull("{$provider}_oauth");
        $state = $request->query('state');
        if (! is_array($pending) || ! is_string($pending['verifier'] ?? null) || ! is_string($state) || ! is_string($pending['state'] ?? null) || ! hash_equals($pending['state'], $state)
            || ($pending['user_id'] ?? null) !== $request->user()->id || ($pending['expires'] ?? 0) < now()->timestamp) {
            return $this->back($provider, 'The connection expired or was not started here. Please try again.');
        }
        if ($request->filled('error') || ! is_string($request->query('code')) || ! $request->filled('code')) return $this->back($provider, 'Account linking was cancelled.');
        if (! self::configured($provider)) return $this->back($provider, 'Account linking is not configured on this site yet.');
        try {
            $fields = ['grant_type' => 'authorization_code', 'code' => $request->query('code'), 'redirect_uri' => route("{$provider}.callback")];
            $client = $this->client($provider);
            if (in_array($provider, ['reddit', 'x'], true)) {
                $client = $client->withBasicAuth(config("services.{$provider}.client_id"), config("services.{$provider}.client_secret"));
            } else {
                $fields += ['client_id' => config("services.{$provider}.client_id"), 'client_secret' => config("services.{$provider}.client_secret")];
            }
            if ($provider === 'x') $fields['code_verifier'] = $pending['verifier'];
            $token = match ($provider) {
                'reddit' => $client->asForm()->post('https://www.reddit.com/api/v1/access_token', $fields),
                'instagram' => $client->asForm()->post('https://api.instagram.com/oauth/access_token', $fields),
                'facebook' => $client->get('https://graph.facebook.com/'.$this->graphVersion().'/oauth/access_token', $fields),
                'x' => $client->asForm()->post('https://api.x.com/2/oauth2/token', $fields),
            };
            $data = $token->json();
            if (! is_array($data)) return $this->back($provider, 'Authorization failed. Please try connecting again.');
            if ($provider === 'instagram' && ! isset($data['access_token']) && is_array($data['data'] ?? null) && array_is_list($data['data']) && count($data['data']) === 1) $data = $data['data'][0];
            if (! is_array($data)) return $this->back($provider, 'Authorization failed. Please try connecting again.');
            $access = $data['access_token'] ?? null;
            if (! $token->successful() || ! is_string($access) || $access === '' || strlen($access) > 16384) return $this->back($provider, 'Authorization failed. Please try connecting again.');
            $api = $this->client($provider)->withToken($access);
            $profile = match ($provider) {
                'reddit' => $api->get('https://oauth.reddit.com/api/v1/me'),
                'instagram' => $api->get('https://graph.instagram.com/me', ['fields' => 'user_id,username']),
                'facebook' => $api->get('https://graph.facebook.com/'.$this->graphVersion().'/me', ['fields' => 'id,name', 'appsecret_proof' => hash_hmac('sha256', $access, config('services.facebook.client_secret'))]),
                'x' => $api->get('https://api.x.com/2/users/me'),
            };
        } catch (ConnectionException) {
            return $this->back($provider, 'Could not reach the service. Please try again.');
        }
        $person = $profile->json($provider === 'x' ? 'data' : null);
        if (! is_array($person)) return $this->back($provider, 'The service did not return a valid account. Please try again.');
        $id = $person['user_id'] ?? $person['id'] ?? null;
        $id = is_int($id) ? (string) $id : $id;
        $username = $provider === 'facebook' ? null : ($person[$provider === 'reddit' ? 'name' : 'username'] ?? null);
        $name = $provider === 'reddit' || $provider === 'instagram' ? $username : ($person['name'] ?? null);
        if (! $profile->successful() || ! is_string($id) || $id === '' || strlen($id) > 255 || ! is_string($name) || trim($name) === '' || strlen($name) > 255
            || ($username !== null && (! is_string($username) || strlen($username) > 255))
            || ($provider === 'instagram' && isset($data['user_id']) && ((! is_string($data['user_id']) && ! is_int($data['user_id'])) || (string) $data['user_id'] !== $id))) {
            return $this->back($provider, 'The service did not return a valid account. Please try again.');
        }
        if (SocialConnection::where('provider', $provider)->where('provider_user_id', $id)->where('user_id', '!=', $request->user()->id)->exists()) return $this->back($provider, 'That account is already connected to another SFD-DJ.EU account.');
        try {
            SocialConnection::updateOrCreate(['user_id' => $request->user()->id, 'provider' => $provider], [
                'provider_user_id' => $id, 'display_name' => $name, 'username' => $username, 'access_token' => $access,
                'refresh_token' => is_string($data['refresh_token'] ?? null) ? $data['refresh_token'] : null,
                'expires_at' => now()->addSeconds(min(31536000, max(1, (int) ($data['expires_in'] ?? 3600)))),
                'scopes' => preg_split('/[ ,]+/', is_string($data['scope'] ?? null) ? $data['scope'] : self::SCOPES[$provider], -1, PREG_SPLIT_NO_EMPTY),
            ]);
        } catch (UniqueConstraintViolationException) {
            return $this->back($provider, 'That account is already connected to another SFD-DJ.EU account.');
        }

        return $this->back($provider, 'Account connected.', true);
    }

    public function disconnect(Request $request, string $provider): RedirectResponse
    {
        abort_unless(in_array($provider, self::PROVIDERS, true), 404);
        $request->session()->forget("{$provider}_oauth");
        $connection = SocialConnection::where('user_id', $request->user()->id)->where('provider', $provider)->first();
        $revoked = ! $connection;
        if ($connection && self::configured($provider)) {
            try {
                $client = $this->client($provider);
                if (in_array($provider, ['reddit', 'x'], true)) {
                    $client = $client->withBasicAuth(config("services.{$provider}.client_id"), config("services.{$provider}.client_secret"))->asForm();
                    $url = $provider === 'reddit' ? 'https://www.reddit.com/api/v1/revoke_token' : 'https://api.x.com/2/oauth2/revoke';
                    $revoked = true;
                    foreach (['refresh_token', 'access_token'] as $field) {
                        if ($value = $connection->getAttribute($field)) $revoked = $client->post($url, ['token' => $value, 'token_type_hint' => $field])->successful() && $revoked;
                    }
                } else {
                    $url = $provider === 'facebook' ? 'https://graph.facebook.com/'.$this->graphVersion().'/me/permissions' : 'https://graph.instagram.com/'.$connection->provider_user_id.'/permissions';
                    $response = $client->withToken($connection->access_token)->delete($url);
                    $revoked = $response->successful() && $response->json('success') === true;
                }
            } catch (ConnectionException) { $revoked = false; }
        }
        $connection?->delete();

        return $this->back($provider, $revoked ? 'Account disconnected.' : 'Account disconnected locally. Remove SFD-DJ.EU from the service\'s connected apps to revoke its access.', $revoked);
    }

    private function back(string $provider, string $message, bool $ok = false): RedirectResponse
    {
        return to_route('settings.connections')->with("{$provider}_notice", $message)->with("{$provider}_notice_ok", $ok);
    }
}
