<?php

namespace Tests\Feature;

use App\Http\Controllers\MediaController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** The live site on Vercel: uploads on Vercel Blob, Pusher for live updates, and what is (not) sent to Vercel. */
class VercelDeployTest extends TestCase
{
    use RefreshDatabase;

    private const TOKEN = 'vercel_blob_rw_store123_secretpart';

    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // one pixel

    private function onBlob(): void
    {
        config(['filesystems.uploads' => 'blob', 'filesystems.disks.blob.token' => self::TOKEN]);
        Http::fake([
            'vercel.com/api/blob/delete' => Http::response(null, 200),
            'vercel.com/api/blob/*' => Http::response(['url' => 'https://store123.public.blob.vercel-storage.com/x', 'pathname' => 'x'], 200),
            // what Vercel Blob knows about a file: nothing about the ones called "gone"
            'vercel.com/api/blob?*' => fn (Request $r) => str_contains($r->url(), 'gone')
                ? Http::response(['error' => ['code' => 'not_found']], 404)
                : Http::response(['size' => 3, 'contentType' => 'image/png', 'uploadedAt' => '2026-10-08T10:00:00Z'], 200),
            'store123.public.blob.vercel-storage.com/*' => Http::response('PNG', 200),
        ]);
    }

    public function test_a_photo_goes_to_vercel_blob_and_is_served_from_there(): void
    {
        $this->onBlob();
        $me = User::factory()->create();

        $this->actingAs($me)->post('/profile/photo', ['photo' => UploadedFile::fake()->createWithContent('me.png', base64_decode(self::PNG))])->assertSessionHasNoErrors();
        $file = substr($me->refresh()->avatar, 4);
        $this->assertMatchesRegularExpression('/^[a-f0-9]{24}\.png$/', $file);

        // the upload: one PUT to the Blob API with the token, the name the site chose, public, never renamed
        Http::assertSent(fn (Request $r) => $r->method() === 'PUT'
            && $r->url() === 'https://vercel.com/api/blob/?pathname=avatars%2F'.$file
            && $r->hasHeader('authorization', 'Bearer '.self::TOKEN)
            && $r->hasHeader('x-api-version', '12')
            && $r->hasHeader('x-vercel-blob-access', 'public')
            && $r->hasHeader('x-add-random-suffix', '0')
            && $r->hasHeader('x-content-type', 'image/png'));

        // the picture's address on the site sends the browser to the file on Vercel Blob
        $this->get("/media/avatar/{$file}")->assertRedirect("https://store123.public.blob.vercel-storage.com/avatars/{$file}");

        // taking the photo off deletes the file there
        $this->actingAs($me)->delete('/profile/photo');
        Http::assertSent(fn (Request $r) => $r->url() === 'https://vercel.com/api/blob/delete' && $r['urls'] === ["https://store123.public.blob.vercel-storage.com/avatars/{$file}"]);
    }

    public function test_the_blob_disk_reads_checks_and_measures_files(): void
    {
        $this->onBlob();
        $disk = MediaController::disk();

        $this->assertSame('https://store123.public.blob.vercel-storage.com/chat/a.png', $disk->url('chat/a.png'));
        $this->assertTrue($disk->exists('chat/a.png'));
        $this->assertSame('PNG', $disk->get('chat/a.png'));
        $this->assertSame(3, $disk->size('chat/a.png'));

        $this->assertFalse($disk->exists('chat/gone.png'));
    }

    public function test_this_computer_keeps_its_own_disk(): void
    {
        $this->assertSame('local', config('filesystems.uploads'));
        $this->assertSame('local', config('filesystems.disks.'.config('filesystems.uploads').'.driver'));
    }

    public function test_the_live_site_files_send_everything_to_laravel_and_leave_the_secrets_here(): void
    {
        $vercel = json_decode(file_get_contents(base_path('vercel.json')), true);
        $this->assertSame('public', $vercel['outputDirectory']);
        $this->assertStringStartsWith('vercel-php@', $vercel['functions']['api/index.php']['runtime']);
        $this->assertStringContainsString('node_modules/**', $vercel['functions']['api/index.php']['excludeFiles']);
        // the PHP source of public/index.php is never handed out as a file ("/" would serve it as the folder's index): "/" and every .php go to Laravel
        // before the static files are looked at, and so does everything that is not a file
        $beforeFiles = array_slice($vercel['routes'], 0, array_search(['handle' => 'filesystem'], $vercel['routes'], true));
        $this->assertContains(['src' => '/', 'dest' => '/api/index.php'], $beforeFiles);
        $this->assertContains(['src' => '/(.*\\.php)(/.*)?', 'dest' => '/api/index.php'], $beforeFiles);
        $this->assertSame('/api/index.php', end($vercel['routes'])['dest']);
        $this->assertStringContainsString("require __DIR__.'/../public/index.php'", file_get_contents(base_path('api/index.php')));

        // nothing secret or local is uploaded
        $ignored = file_get_contents(base_path('.vercelignore'));
        foreach (['/.env', '/.env.*', '/vendor', '/node_modules', '/database/*.sqlite', '/bootstrap/cache/*.php', '/storage/app/*', '/public/build'] as $path) {
            $this->assertStringContainsString($path."\n", str_replace("\r", '', $ignored), "{$path} would be uploaded to Vercel");
        }

        // live updates: Pusher when built for the live site, Reverb here
        $this->assertStringContainsString("import.meta.env.VITE_BROADCASTER === 'pusher'", file_get_contents(resource_path('js/app.tsx')));
    }
}
