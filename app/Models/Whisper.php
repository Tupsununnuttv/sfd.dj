<?php

namespace App\Models;

use App\Http\Controllers\MediaController;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A private message from one person to another, or to a group (`group_id`, with no `to_id`): text, or a voice message (`audio`, with `body` empty). */
class Whisper extends Model
{
    /** The longest voice message, in seconds. */
    public const VOICE_SECONDS = 120;

    /** What a recording may be (by its real type, never the name the browser gave it) and the extension it is stored with. Browsers record WebM (Chrome, Edge, Firefox use Ogg) or MP4 (Safari). */
    public const VOICE_TYPES = [
        'audio/webm' => 'webm', 'video/webm' => 'webm', 'audio/ogg' => 'ogg', 'application/ogg' => 'ogg', 'video/ogg' => 'ogg',
        'audio/mp4' => 'm4a', 'video/mp4' => 'm4a', 'audio/x-m4a' => 'm4a', 'audio/aac' => 'aac',
        'audio/mpeg' => 'mp3', 'audio/wav' => 'wav', 'audio/x-wav' => 'wav', 'audio/vnd.wave' => 'wav',
    ];

    private const CONTENT_TYPES = ['webm' => 'audio/webm', 'ogg' => 'audio/ogg', 'm4a' => 'audio/mp4', 'aac' => 'audio/aac', 'mp3' => 'audio/mpeg', 'wav' => 'audio/wav'];

    protected $fillable = ['from_id', 'to_id', 'group_id', 'body', 'audio', 'audio_seconds', 'reply_to_id', 'read_at'];

    protected static function booted(): void
    {
        static::deleting(fn (Whisper $whisper) => $whisper->forgetAudio());
    }

    /** Every whisper between these two people, either direction. */
    public function scopeBetween(Builder $query, int $a, int $b): void
    {
        $query->whereNull('group_id')->where(fn ($pair) => $pair
            ->where(fn ($q) => $q->where('from_id', $a)->where('to_id', $b))
            ->orWhere(fn ($q) => $q->where('from_id', $b)->where('to_id', $a)));
    }

    public static function history(Builder|HasMany $query, int $me, int $before = 0): array
    {
        $messages = $query->when($before > 0, fn ($q) => $q->where('id', '<', $before))->latest('id')->limit(101)->get();

        return ['messages' => $messages->take(100)->reverse()->map->payload($me)->values(), 'has_more' => $messages->count() > 100];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(WhisperGroup::class, 'group_id');
    }

    /** The whisper this one answers. */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_id');
    }

    /** Where the recording is on the uploads disk. */
    public function audioPath(): ?string
    {
        return $this->audio ? 'whispers/'.$this->audio : null;
    }

    public function contentType(): string
    {
        return self::CONTENT_TYPES[pathinfo((string) $this->audio, PATHINFO_EXTENSION)] ?? 'application/octet-stream';
    }

    /** The recording goes when the whisper does. */
    public function forgetAudio(): void
    {
        $this->audio && MediaController::disk()->delete($this->audioPath());
    }

    /** Every recording sent to or by somebody, for when their account is deleted (the database takes the whispers with it, but not the files). */
    public static function forgetAudioOf(User $user): void
    {
        static::where(fn ($q) => $q->where('from_id', $user->id)->orWhere('to_id', $user->id))->whereNotNull('audio')->get()->each->forgetAudio();
    }

    public function payload(int $me): array
    {
        return [
            'id' => $this->id,
            'mine' => $this->from_id === $me,
            'from_id' => $this->from_id,
            'to_id' => $this->to_id,
            'group_id' => $this->group_id,
            'from' => $this->group_id ? $this->sender->only('id', 'name', 'username', 'avatar') : null, // in a group the page needs to know who wrote it
            'body' => $this->body,
            'voice' => $this->voicePayload(),
            'reply' => $this->replyPayload(),
            'at' => $this->created_at->toIso8601String(),
        ];
    }

    /** What the page quotes above a reply: who wrote the whisper it answers and what it said (a voice message has no text). Load `replyTo` first for many at once. */
    public function replyPayload(): ?array
    {
        $original = $this->replyTo;

        return $original ? ['id' => $original->id, 'from_id' => $original->from_id, 'body' => $original->audio ? '🎤 Voice message' : $original->body] : null;
    }

    /** What the page needs to show a voice message (it fetches the recording from api.whispers.audio). */
    public function voicePayload(): ?array
    {
        return $this->audio ? ['seconds' => (int) $this->audio_seconds] : null;
    }
}
