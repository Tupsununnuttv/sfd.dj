<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\StreamingUrl;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class StreamingImportSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_untrusted_hosts_and_ambiguous_urls_are_rejected_without_requests(): void
    {
        Http::fake();
        foreach (['http://soundcloud.com/track', 'https://soundcloud.com.attacker.test/track', 'https://localhost/track', 'https://127.0.0.1/track', 'https://name:pass@soundcloud.com/track', 'https://soundcloud.com:8443/track', 'https://soundcloud.com\\@127.0.0.1/track'] as $url) {
            try {
                StreamingUrl::page($url);
                $this->fail("Unsafe URL was accepted: {$url}");
            } catch (ValidationException $e) {
                $this->assertArrayHasKey('url', $e->errors());
            }
        }
        Http::assertNothingSent();
    }

    public function test_redirects_stay_on_the_selected_service(): void
    {
        Http::fake([
            'https://on.soundcloud.com/safe' => Http::response('', 302, ['Location' => 'https://soundcloud.com/artist/track']),
            'https://soundcloud.com/artist/track' => Http::response('Track page'),
            'https://on.soundcloud.com/unsafe' => Http::response('', 302, ['Location' => 'http://169.254.169.254/latest/meta-data']),
        ]);
        $this->assertSame('Track page', StreamingUrl::page('https://on.soundcloud.com/safe')->body());
        try {
            StreamingUrl::page('https://on.soundcloud.com/unsafe');
            $this->fail('An unsafe redirect was followed.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('url', $e->errors());
        }
        Http::assertSentCount(3);
    }

    public function test_import_rejects_a_mismatched_service_without_modifying_the_playlist(): void
    {
        Http::fake();
        $user = User::factory()->create();
        $playlist = $user->playlists()->create(['name' => 'Streaming']);
        $response = $this->actingAs($user)->postJson("/api/playlists/{$playlist->id}/import", ['provider' => 'spotify', 'text' => 'https://www.youtube.com/watch?v=aaaaaaaaaaa'])
            ->assertOk()->assertJsonPath('added', 0);
        $this->assertStringContainsString('selected streaming service', $response->json('errors.0'));
        $this->assertSame(0, $playlist->songs()->count());
        Http::assertNothingSent();
    }
}
