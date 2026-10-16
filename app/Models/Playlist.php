<?php

namespace App\Models;

use App\Services\Music;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Playlist extends Model
{
    public const MAX_SONGS = 5000;

    protected $fillable = ['user_id', 'name', 'kind', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** The songs in the order they will be played: the first one is the next track. */
    public function songs(): HasMany
    {
        return $this->hasMany(PlaylistSong::class)->orderBy('position')->orderBy('id');
    }

    /** The list a person plays from: the one they marked active, or else their first one (which then becomes active). A grabbed song goes into whichever list the person picks (RoomController::vote). */
    public static function activeFor(User $user): ?self
    {
        $mine = static::where('user_id', $user->id)->where('kind', 'custom');
        $active = (clone $mine)->where('is_active', true)->first();

        if (! $active && ($active = (clone $mine)->orderBy('id')->first())) {
            $active->makeActive();
        }

        return $active;
    }

    /** Make this the list the person plays from, and no other. */
    public function makeActive(): void
    {
        static::where('user_id', $this->user_id)->where('id', '!=', $this->id)->update(['is_active' => false]);
        $this->forceFill(['is_active' => true])->save();
    }

    /** Add songs at the end, skipping ones already in the list and stopping at the size limit. Returns how many were added. */
    public function addSongs(array $songs): int
    {
        $added = 0;
        $count = $this->songs()->count();
        $position = (int) (PlaylistSong::where('playlist_id', $this->id)->max('position') ?? 0);
        $max = User::find($this->user_id)?->limits()['songs'] ?? self::MAX_SONGS;

        foreach ($songs as $song) {
            if ($count >= $max) {
                break;
            }

            // a song grabbed in a room says only what plays: a SoundCloud one is still SoundCloud, and its address is somewhere in somebody's list already
            $origin = $song['origin'] ?? (Music::isSoundCloud($song['youtube_id']) ? 'soundcloud' : 'youtube');
            $row = $this->songs()->firstOrCreate(['youtube_id' => $song['youtube_id']], [
                'title' => $song['title'],
                'channel' => $song['channel'] ?? null,
                'thumbnail' => $song['thumbnail'] ?? null,
                'duration' => $song['duration'] ?? 0,
                'origin' => $origin,
                'origin_url' => $song['origin_url'] ?? ($origin === 'soundcloud' ? PlaylistSong::where('youtube_id', $song['youtube_id'])->whereNotNull('origin_url')->value('origin_url') : null),
                'position' => $position + 1,
            ]);

            if ($row->wasRecentlyCreated) {
                $added++;
                $count++;
                $position++;
            }
        }

        return $added;
    }

    /** Put the songs in the order of `$ids`. Songs that are not named keep their order after the named ones; names of other lists' songs are ignored. */
    public function reorder(array $ids): void
    {
        $mine = $this->songs()->pluck('id')->all();
        $order = [...array_values(array_unique(array_intersect($ids, $mine))), ...array_values(array_diff($mine, $ids))];

        // one transaction: a few hundred separate updates would each wait for the disk
        DB::transaction(function () use ($order) {
            foreach ($order as $i => $id) {
                PlaylistSong::whereKey($id)->update(['position' => $i + 1]);
            }
        });
    }

    public function shuffleSongs(): void
    {
        $this->reorder($this->songs()->pluck('id')->shuffle()->all());
    }
}
