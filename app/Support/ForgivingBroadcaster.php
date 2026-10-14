<?php

namespace App\Support;

use Illuminate\Broadcasting\Broadcasters\PusherBroadcaster;
use Illuminate\Broadcasting\BroadcastException;

/**
 * The broadcaster for Reverb and Pusher that does not let a live-update server that is down break the request. Nearly every action here (a chat line, a vote, a song)
 * is saved first and announced after (events with ShouldBroadcastNow), so a server that does not answer used to turn a saved message into an error page. Now the failure is
 * only logged (storage/logs/laravel.log); the others see the change at their next refresh or poll. See AppServiceProvider.
 */
final class ForgivingBroadcaster extends PusherBroadcaster
{
    public function broadcast(array $channels, $event, array $payload = []): void
    {
        try {
            parent::broadcast($channels, $event, $payload);
        } catch (BroadcastException $e) {
            report($e);
        }
    }
}
