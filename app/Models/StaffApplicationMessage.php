<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One reply under a staff application: from a staff member, or from the applicant. */
class StaffApplicationMessage extends Model
{
    protected $fillable = ['staff_application_id', 'user_id', 'from_staff', 'body'];

    protected function casts(): array
    {
        return ['from_staff' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payload(): array
    {
        return [
            'id' => $this->id,
            'from_staff' => $this->from_staff,
            'who' => $this->user ? ($this->user->username ?: $this->user->name) : ($this->from_staff ? 'SFD-DJ.EU staff' : 'Applicant'),
            'body' => $this->body,
            'at' => $this->created_at->toIso8601String(),
        ];
    }
}
