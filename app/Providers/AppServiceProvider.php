<?php

namespace App\Providers;

use App\Models\Room;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
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
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);

        // every {room} route (chat, queue, ...) refuses people who may not enter a private room
        Route::bind('room', function (string $slug) {
            $room = Room::where(fn ($query) => $query->where('slug', $slug)->orWhere('legacy_slug', $slug))->firstOrFail();
            abort_unless($room->canEnter(request()->user()), 403, 'This room is private.');

            return $room;
        });
    }
}
