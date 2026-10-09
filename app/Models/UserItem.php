<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Something a person bought in the Avatar shop (a character, a badge, an accessory, a frame or an effect). What costs nothing is free for everybody and has no row. */
class UserItem extends Model
{
    protected $fillable = ['user_id', 'slot', 'item', 'price'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
