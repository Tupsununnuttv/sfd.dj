<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SitePermission extends Model
{
    public $timestamps = false;

    protected $fillable = ['role', 'permission'];

    /** [role => [permission, ...]] for every stored role. Cached; call forget() after changing rows. */
    public static function matrix(): array
    {
        return Cache::rememberForever('site_permissions', fn () => static::all()->groupBy('role')->map(fn ($rows) => $rows->pluck('permission')->all())->all());
    }

    public static function forget(): void
    {
        Cache::forget('site_permissions');
    }
}
