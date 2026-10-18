<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WhisperCall extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['caller_id' => 'integer', 'callee_id' => 'integer', 'video' => 'boolean', 'caller_seen' => 'datetime', 'callee_seen' => 'datetime'];
    }

    public static function expire(): void
    {
        static::whereIn('status', ['ringing', 'active'])->where(function ($q) {
            $q->where('caller_seen', '<', now()->subSeconds(45))
                ->orWhere(fn ($r) => $r->where('status', 'ringing')->where('created_at', '<', now()->subSeconds(90)))
                ->orWhere(fn ($r) => $r->where('status', 'active')->where('callee_seen', '<', now()->subSeconds(45)));
        })->update(['status' => 'ended', 'offer' => null, 'answer' => null]);
        static::where('status', 'ended')->where('updated_at', '<', now()->subDay())->delete();
    }
}
