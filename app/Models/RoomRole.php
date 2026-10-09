<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomRole extends Model
{
    protected $fillable = ['room_id', 'name', 'color', 'rank', 'permissions', 'builtin'];

    protected function casts(): array
    {
        return ['permissions' => 'array', 'builtin' => 'boolean'];
    }
}
