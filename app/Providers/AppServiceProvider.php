<?php

namespace App\Providers;

use App\Models\Room;
use App\Support\DiscordActivity;
use App\Support\ForgivingBroadcaster;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;

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
        Auth::viaRequest('discord_guest', fn () => null);
        RateLimiter::for('room-watchers', fn (Request $request) => [
            Limit::perMinute(8)->by('watcher:'.hash('sha256', $request->session()->getId())),
            Limit::perMinute(240)->by('watcher-ip:'.$request->ip()),
        ]);
        // Keep page chunks and room scenes on demand: global prefetch fetches the whole app after login.

        // a live-update server (Reverb here, Pusher on the live site) that is down must not turn a saved chat line or vote into an error page
        foreach (['reverb', 'pusher'] as $driver) {
            Broadcast::extend($driver, fn ($app, array $config) => new ForgivingBroadcaster(Broadcast::pusher($config), $config['jsonp'] ?? false));
        }

        // Inside Discord the page lives at <application id>.discordsays.com and its CSP only allows that host, so a script or style link
        // must not point at the site's own address (which is what asset() builds): there they are root-relative and go through the proxy
        Vite::createAssetPathsUsing(fn (string $path, ?bool $secure = null) => DiscordActivity::request(request()) ? '/'.ltrim($path, '/') : asset($path, $secure));

        // every {room} route (chat, queue, ...) refuses people who may not enter a private room. A room's old addresses find it too (it was renamed)
        Route::bind('room', function (string $slug) {
            $room = Room::atAddress($slug)->firstOrFail();
            abort_unless($room->canEnter(request()->user()), 403, 'This room is private.');

            return $room;
        });
    }
}
