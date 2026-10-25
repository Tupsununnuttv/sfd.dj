<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDevice extends Model
{
    protected $guarded = [];

    protected $hidden = ['device_hash'];

    protected function casts(): array
    {
        return ['last_seen_at' => 'datetime'];
    }
}
