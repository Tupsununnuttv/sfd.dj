<?php

namespace App\Console\Commands;

use App\Http\Controllers\MediaController;
use App\Models\Room;
use App\Models\RoomBackgroundAsset;
use Illuminate\Console\Command;

class ArchiveRoomBackgrounds extends Command
{
    protected $signature = 'room-backgrounds:archive';

    protected $description = 'Preserve existing uploaded room backgrounds in the database before replacing local storage';

    public function handle(): int
    {
        $saved = 0;
        $missing = 0;
        foreach (Room::whereNotNull('custom_background')->select('id', 'custom_background')->lazyById() as $room) {
            if (RoomBackgroundAsset::where('room_id', $room->id)->where('name', $room->custom_background)->exists()) {
                continue;
            }
            $name = $room->custom_background;
            $path = "room-backgrounds/{$name}";
            if (! preg_match('/^[a-f0-9]{24}\.(png|jpe?g|webp)$/', $name) || ! MediaController::disk()->exists($path)) {
                $missing++;

                continue;
            }
            $bytes = MediaController::disk()->get($path);
            $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes);
            if (strlen($bytes) > 4194304 || ! in_array($mime, ['image/png', 'image/jpeg', 'image/webp'], true)) {
                $missing++;

                continue;
            }
            RoomBackgroundAsset::keep($room, $name, $mime, $bytes);
            $saved++;
        }
        $this->info("Archived {$saved} background(s). {$missing} missing or unsupported file(s).");

        return $missing ? self::FAILURE : self::SUCCESS;
    }
}
