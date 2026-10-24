<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class RoomFeatureRelease extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['key', 'preview_at', 'early_days', 'enabled'];

    protected function casts(): array
    {
        return ['preview_at' => 'datetime', 'early_days' => 'integer', 'enabled' => 'boolean'];
    }

    public function publicAt(): ?Carbon
    {
        return $this->preview_at?->copy()->addDays($this->early_days);
    }

    public function availableIn(Room $room): bool
    {
        return array_key_exists($this->key, config('room-releases.features', []))
            && $this->enabled && $this->preview_at && $this->preview_at->lte(now())
            && ($room->early_access || $this->publicAt()->lte(now()));
    }

    public function phase(): string
    {
        if (! $this->enabled || ! $this->preview_at) return 'paused';
        if ($this->preview_at->gt(now())) return 'scheduled';
        return $this->publicAt()->lte(now()) ? 'public' : 'early';
    }
}
