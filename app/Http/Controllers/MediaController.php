<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

/**
 * Uploaded pictures (profile photos, chat images, room backgrounds, room emojis) live on the uploads disk and are reached through here, by their random file name:
 * on this computer the private local disk, on the live site Vercel Blob (config filesystems.uploads), where this sends the browser on to the file.
 */
class MediaController extends Controller
{
    private const TYPES = ['png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp', 'gif' => 'image/gif'];

    public function avatar(string $file): Response
    {
        return $this->serve('avatars', $file);
    }

    public function chat(string $file): Response
    {
        return $this->serve('chat', $file);
    }

    public function roomBackground(string $file): Response
    {
        return $this->serve('room-backgrounds', $file);
    }

    public function emoji(string $file): Response
    {
        return $this->serve('emojis', $file);
    }

    /** The disk the uploads live on. */
    public static function disk(): Filesystem
    {
        return Storage::disk(config('filesystems.uploads'));
    }

    /** Store an upload under a random name. The extension is taken from the file's real type, never from the client. */
    public static function store(UploadedFile $upload, string $dir): string
    {
        $ext = match ($upload->getMimeType()) {
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'jpg',
        };

        $name = bin2hex(random_bytes(12)).'.'.$ext;
        self::disk()->putFileAs($dir, $upload, $name);

        return $name;
    }

    private function serve(string $dir, string $file): Response
    {
        abort_unless(preg_match('/^[a-f0-9]{16,32}\.(png|jpe?g|webp|gif)$/', $file, $m), 404);

        // on the live site the file is on Vercel Blob: send the browser there (a name is never reused, so the answer may be kept)
        if (config('filesystems.disks.'.config('filesystems.uploads').'.driver') !== 'local') {
            return redirect()->away(self::disk()->url("{$dir}/{$file}"))->header('Cache-Control', 'public, max-age=604800');
        }

        $path = self::disk()->path("{$dir}/{$file}");
        abort_unless(is_file($path), 404);

        return response()->file($path, [
            'Content-Type' => self::TYPES[$m[1]],
            'Cache-Control' => 'private, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
