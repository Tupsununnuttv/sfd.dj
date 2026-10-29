<?php

namespace App\Models;

use App\Support\StaffApplicationForm;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Validation\ValidationException;

/** One staff application: the 15 answers, who sent it (from the website or from Discord), where the review stands, and the private staff notes. */
class StaffApplication extends Model
{
    public const STATUSES = ['pending' => 'Pending', 'under_review' => 'Under Review', 'accepted' => 'Accepted', 'rejected' => 'Rejected'];

    /** Still waiting for a decision: an applicant can have one of these at a time. */
    public const OPEN = ['pending', 'under_review'];

    protected $fillable = ['user_id', 'source', 'discord_id', 'position', 'status', 'answers', 'staff_notes', 'open_key', 'discord_message_id'];

    protected function casts(): array
    {
        return ['answers' => 'array', 'reviewed_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** The replies between staff and the applicant, oldest first. */
    public function messages(): HasMany
    {
        return $this->hasMany(StaffApplicationMessage::class)->orderBy('id');
    }

    /** Add a reply. Staff write as staff; the applicant writes about their own application. */
    public function reply(User $from, string $body, bool $fromStaff): StaffApplicationMessage
    {
        return $this->messages()->create(['user_id' => $from->id, 'from_staff' => $fromStaff, 'body' => $body]);
    }

    private function thread(): array
    {
        return $this->messages()->with('user:id,name,username')->get()->map->payload()->all();
    }

    /** The applicant's open application, if they have one. */
    public static function openFor(User $user): ?self
    {
        return static::where('user_id', $user->id)->whereIn('status', self::OPEN)->first();
    }

    /** Store a new application. An applicant with one still open gets a validation error instead (the unique open_key settles two sent at the same moment). */
    public static function submit(array $answers, string $source, ?User $user, ?string $discordId = null): self
    {
        $answers = StaffApplicationForm::clean($answers);
        $discordId ??= $user?->discord_id;

        try {
            return static::create([
                'user_id' => $user?->id,
                'source' => $source,
                'discord_id' => $discordId,
                'position' => $answers['position'],
                'status' => 'pending', // the column default is not on the model until it is read again, and the Discord message needs it
                'answers' => $answers,
                'open_key' => $user ? "u{$user->id}" : "d{$discordId}",
            ]);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['application' => 'You already have an application waiting for a decision.']);
        }
    }

    /** Move to another status. Returns false when nothing changed. */
    public function setStatus(string $status, ?User $by = null, ?string $byName = null): bool
    {
        if ($status === $this->status) {
            return false;
        }

        $this->status = $status;
        $this->open_key = in_array($status, self::OPEN, true) ? ($this->user_id ? "u{$this->user_id}" : ($this->discord_id ? "d{$this->discord_id}" : "a{$this->id}")) : null;
        $this->reviewed_by = $by?->id;
        $this->reviewer_name = $by ? null : $byName;
        $this->reviewed_at = now();

        try {
            $this->save();
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['status' => 'The applicant has another application waiting for a decision.']);
        }

        return true;
    }

    public function statusLabel(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function applicantName(): string
    {
        return $this->user ? ($this->user->username ?: $this->user->name) : ($this->answers['discord_username'] ?? 'Unknown');
    }

    /** Who decided, for display. */
    public function reviewerName(): ?string
    {
        return $this->reviewer ? ($this->reviewer->username ?: $this->reviewer->name) : $this->reviewer_name;
    }

    /** One row of the staff list. */
    public function summary(): array
    {
        return [
            'id' => $this->id,
            'applicant' => $this->applicantName(),
            'position' => $this->position,
            'status' => $this->status,
            'source' => $this->source,
            'submitted_at' => $this->created_at->toIso8601String(),
        ];
    }

    /** Everything staff see when they open an application: the applicant, every answer under its question, the notes and the decision. */
    public function detail(): array
    {
        $this->loadMissing('user', 'reviewer');

        return $this->summary() + [
            'applicant_account' => $this->user ? ['id' => $this->user->id, 'name' => $this->user->name, 'username' => $this->user->username, 'joined' => $this->user->created_at->toIso8601String()] : null,
            'discord_id' => $this->discord_id,
            'answers' => collect(StaffApplicationForm::fields())->map(fn (array $field, int $i) => [
                'number' => $i + 1,
                'section' => $field['section'],
                'label' => $field['label'],
                'value' => (string) ($this->answers[$field['key']] ?? ''),
            ])->all(),
            'staff_notes' => $this->staff_notes,
            'messages' => $this->thread(),
            'reviewed_by' => $this->reviewerName(),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
        ];
    }

    /** What the applicant sees on the Staff application page. */
    public function forApplicant(): array
    {
        return [
            'status' => $this->status,
            'status_label' => $this->statusLabel(),
            'position' => $this->position,
            'submitted_at' => $this->created_at->toIso8601String(),
            'decided_at' => in_array($this->status, self::OPEN, true) ? null : $this->reviewed_at?->toIso8601String(),
            'messages' => $this->thread(),
        ];
    }
}
