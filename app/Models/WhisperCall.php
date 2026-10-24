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

    public static function expire(?array $participants = null): void
    {
        static::when($participants !== null, fn ($q) => $q->where(fn ($p) => $p->whereIn('caller_id', $participants)->orWhereIn('callee_id', $participants)))
            ->whereIn('status', ['ringing', 'active'])->where(function ($q) {
            $q->where('caller_seen', '<', now()->subSeconds(45))
                ->orWhere(fn ($r) => $r->where('status', 'ringing')->where('created_at', '<', now()->subSeconds(90)))
                ->orWhere(fn ($r) => $r->where('status', 'active')->where('callee_seen', '<', now()->subSeconds(45)));
        })->update(['status' => 'ended', 'offer' => null, 'answer' => null]);
        // The scheduled sweep owns historical cleanup; idle polling should not scan every call.
        if ($participants === null) {
            static::where('status', 'ended')->where('updated_at', '<', now()->subDay())->delete();
        }
    }
}
