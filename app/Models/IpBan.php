<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IpBan extends Model
{
    protected $fillable = ['ip', 'reason', 'banned_by'];
}
