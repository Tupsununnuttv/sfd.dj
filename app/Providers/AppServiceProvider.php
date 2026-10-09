<?php

namespace App\Providers;

use App\Models\Room;
use App\Support\VercelBlob;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use League\Flysystem\Filesystem;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // uploads on the live site go to Vercel Blob (config/filesystems.php, disk "blob")
        Storage::extend('vercel-blob', function ($app, array $config) {
            $adapter = new VercelBlob((string) $config['token']);

            return new FilesystemAdapter(new Filesystem($adapter, $config), $adapter, $config);
        });

        // every {room} route (chat, queue, ...) refuses people who may not enter a private room
        Route::bind('room', function (string $slug) {
            $room = Room::where('slug', $slug)->firstOrFail();
            abort_unless($room->canEnter(request()->user()), 403, 'This room is private.');

            return $room;
        });
    }
}
