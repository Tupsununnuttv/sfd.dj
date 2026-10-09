<?php

namespace App\Support;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use League\Flysystem\Config;
use League\Flysystem\FileAttributes;
use League\Flysystem\FilesystemAdapter;
use League\Flysystem\UnableToCopyFile;
use League\Flysystem\UnableToDeleteFile;
use League\Flysystem\UnableToReadFile;
use League\Flysystem\UnableToRetrieveMetadata;
use League\Flysystem\UnableToSetVisibility;
use League\Flysystem\UnableToWriteFile;

/**
 * Vercel Blob as a Laravel disk (driver "vercel-blob"): where uploads live on the live site, where nothing written to the server's own disk lasts.
 * Every file is public by its URL, like the random file names on this computer were. Only what the site does with uploads is here:
 * write, read, delete, exists, size and its URL. Speaks the same HTTP API as Vercel's @vercel/blob package (API version 12).
 */
final class VercelBlob implements FilesystemAdapter
{
    private const API = 'https://vercel.com/api/blob';

    private readonly string $store;

    public function __construct(private readonly string $token)
    {
        // a token is "vercel_blob_rw_<store id>_<secret>", and the store id is part of every file's address
        $this->store = explode('_', $token)[3] ?? '';
    }

    /** The public address of a file. Laravel's Storage::url() asks for it. */
    public function getUrl(string $path): string
    {
        return "https://{$this->store}.public.blob.vercel-storage.com/".ltrim($path, '/');
    }

    private function api(): PendingRequest
    {
        return Http::withToken($this->token)->withHeaders(['x-api-version' => '12'])->timeout(30);
    }

    /** What Vercel Blob knows about a file, or null when it is not there. */
    private function head(string $path): ?array
    {
        $res = $this->api()->get(self::API, ['url' => $this->getUrl($path)]);

        return $res->successful() ? $res->json() : null;
    }

    public function fileExists(string $path): bool
    {
        return $this->head($path) !== null;
    }

    public function directoryExists(string $path): bool
    {
        return false; // there are no folders, only names with slashes in them (Storage::exists asks for a file or a folder)
    }

    public function write(string $path, string $contents, Config $config): void
    {
        $res = $this->api()
            ->withHeaders([
                'x-vercel-blob-access' => 'public',
                'x-add-random-suffix' => '0', // the site picks random names itself
                'x-allow-overwrite' => '1',
                'x-content-type' => $config->get('ContentType') ?? $config->get('mimetype') ?? self::mime($path),
                'x-cache-control-max-age' => '31536000', // a name is never used for another file
            ])
            ->withBody($contents, 'application/octet-stream')
            ->put(self::API.'/?'.http_build_query(['pathname' => ltrim($path, '/')]));

        $res->successful() || throw UnableToWriteFile::atLocation($path, self::why($res));
    }

    public function writeStream(string $path, $contents, Config $config): void
    {
        $this->write($path, stream_get_contents($contents), $config);
    }

    public function read(string $path): string
    {
        $res = Http::timeout(30)->get($this->getUrl($path));
        $res->successful() || throw UnableToReadFile::fromLocation($path, self::why($res));

        return $res->body();
    }

    public function readStream(string $path)
    {
        $stream = fopen('php://temp', 'w+b');
        fwrite($stream, $this->read($path));
        rewind($stream);

        return $stream;
    }

    public function delete(string $path): void
    {
        $res = $this->api()->post(self::API.'/delete', ['urls' => [$this->getUrl($path)]]);
        $res->successful() || throw UnableToDeleteFile::atLocation($path, self::why($res));
    }

    public function deleteDirectory(string $path): void
    {
        // not needed: the site deletes files one by one
    }

    public function createDirectory(string $path, Config $config): void
    {
        // folders do not exist on Vercel Blob
    }

    public function setVisibility(string $path, string $visibility): void
    {
        throw UnableToSetVisibility::atLocation($path, 'Every file on Vercel Blob is public by its address.');
    }

    public function visibility(string $path): FileAttributes
    {
        return new FileAttributes($path, null, 'public');
    }

    public function mimeType(string $path): FileAttributes
    {
        $meta = $this->head($path) ?? throw UnableToRetrieveMetadata::mimeType($path);

        return new FileAttributes($path, null, null, null, $meta['contentType'] ?? null);
    }

    public function lastModified(string $path): FileAttributes
    {
        $meta = $this->head($path) ?? throw UnableToRetrieveMetadata::lastModified($path);

        return new FileAttributes($path, null, null, isset($meta['uploadedAt']) ? strtotime($meta['uploadedAt']) : null);
    }

    public function fileSize(string $path): FileAttributes
    {
        $meta = $this->head($path) ?? throw UnableToRetrieveMetadata::fileSize($path);

        return new FileAttributes($path, $meta['size'] ?? null);
    }

    public function listContents(string $path, bool $deep): iterable
    {
        return []; // ponytail: no listing, the database knows every file name; page through GET /?prefix= if a listing is ever needed
    }

    public function move(string $source, string $destination, Config $config): void
    {
        $this->copy($source, $destination, $config);
        $this->delete($source);
    }

    public function copy(string $source, string $destination, Config $config): void
    {
        try {
            $this->write($destination, $this->read($source), $config);
        } catch (\Throwable $e) {
            throw UnableToCopyFile::fromLocationTo($source, $destination, $e);
        }
    }

    private static function mime(string $path): string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            default => 'application/octet-stream',
        };
    }

    private static function why(Response $res): string
    {
        return "Vercel Blob answered {$res->status()}: ".mb_substr($res->body(), 0, 200);
    }
}
