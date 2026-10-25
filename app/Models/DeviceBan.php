<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceBan extends Model
{
    protected $guarded = [];

    protected $hidden = ['device_hash'];
}
