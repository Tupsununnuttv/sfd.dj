<?php

namespace App\Providers;

use App\Models\Room;
use App\Support\ForgivingBroadcaster;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

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

        // a live-update server (Reverb here, Pusher on the live site) that is down must not turn a saved chat line or vote into an error page
        foreach (['reverb', 'pusher'] as $driver) {
            Broadcast::extend($driver, fn ($app, array $config) => new ForgivingBroadcaster(Broadcast::pusher($config), $config['jsonp'] ?? false));
        }

        // every {room} route (chat, queue, ...) refuses people who may not enter a private room. A room's old addresses find it too (it was renamed)
        Route::bind('room', function (string $slug) {
            $room = Room::atAddress($slug)->firstOrFail();
            abort_unless($room->canEnter(request()->user()), 403, 'This room is private.');

            return $room;
        });
    }
}
