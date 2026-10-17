<?php

namespace App\Services;

use App\Events\PlaybackUpdated;
use App\Models\Playlist;
use App\Models\Room;
use App\Models\RoomBotPresence;
use App\Models\User;

class SelfDjPlayback
{
    /** Clear the old assignment before stopping it, otherwise advancing could start it again. */
    public function configure(Room $room, ?User $bot, ?Playlist $playlist): void
    {
        $before = $room->autoHostBot;
        if ($before && $before->id !== $bot?->id) {
            $room->update(['auto_host_bot_id' => null, 'auto_host_playlist_id' => null]);
            $room->unsetRelation('autoHostPlaylist');
            RoomBotPresence::leave($room, $before);
            $room->takeOut($before);
        }
        $room->update(['auto_host_bot_id' => $bot?->id, 'auto_host_playlist_id' => $playlist?->id]);
        $room->unsetRelation('autoHostBot')->unsetRelation('autoHostPlaylist');
        if ($bot) {
            RoomBotPresence::hold($room, $bot);
            $room->startAutoHostIfIdle();
        }
        PlaybackUpdated::dispatch($room->refresh());
    }
}
