<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One durable copy per room, kept outside normal room payloads and list queries. */
class RoomBackgroundAsset extends Model
{
    protected $primaryKey = 'room_id';

    public $incrementing = false;

    protected $guarded = [];

    protected $hidden = ['content'];

    public static function keep(Room $room, string $name, string $mime, string $bytes): self
    {
        return static::updateOrCreate(['room_id' => $room->id], [
            'name' => $name, 'mime' => $mime,
            'checksum' => hash('sha256', $bytes), 'content' => base64_encode($bytes),
        ]);
    }
}
