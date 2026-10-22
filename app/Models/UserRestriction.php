<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserRestriction extends Model
{
    protected $fillable = ['user_id', 'target_id', 'blocked', 'ignored'];

    protected function casts(): array
    {
        return ['blocked' => 'boolean', 'ignored' => 'boolean'];
    }

    public function target(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_id');
    }

    public static function hiddenAuthors(int $viewer): Builder
    {
        return self::where('user_id', $viewer)->where(fn ($q) => $q->where('blocked', true)->orWhere('ignored', true))->select('target_id');
    }

    public static function blocksBetween(int $a, int $b): bool
    {
        return self::where('blocked', true)->where(fn ($q) => $q
            ->where(fn ($pair) => $pair->where('user_id', $a)->where('target_id', $b))
            ->orWhere(fn ($pair) => $pair->where('user_id', $b)->where('target_id', $a)))->exists();
    }

    public static function state(int $viewer): array
    {
        $all = self::where('user_id', $viewer)->orderBy('target_id')->get();

        return [
            'blocked' => $all->where('blocked', true)->pluck('target_id')->map(fn ($id) => (int) $id)->values()->all(),
            'ignored' => $all->where('ignored', true)->pluck('target_id')->map(fn ($id) => (int) $id)->values()->all(),
        ];
    }
}
