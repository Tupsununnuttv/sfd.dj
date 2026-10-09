<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One line of somebody's SFD Coins: what came or went, why, and what they had after it. */
class CoinTransaction extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'amount', 'balance', 'reason', 'note'];

    protected function casts(): array
    {
        return ['amount' => 'integer', 'balance' => 'integer'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
