<?php

namespace App\Models;

use App\Support\Plans;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** A prepaid month, activated by its recipient independently of recurring billing. */
class SubscriptionGift extends Model
{
    protected $fillable = ['sender_id', 'recipient_id', 'plan', 'amount', 'stripe_session_id'];

    protected function casts(): array
    {
        return ['amount' => 'integer', 'paid_at' => 'datetime', 'activated_at' => 'datetime', 'expires_at' => 'datetime', 'revoked_at' => 'datetime'];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    /** Only the exact paid session we created can deliver this gift. Duplicate webhooks do nothing. */
    public static function settle(array $session): void
    {
        $gift = static::find($session['metadata']['gift_id'] ?? 0);
        if (! $gift || $gift->revoked_at || ($session['metadata']['kind'] ?? '') !== 'subscription_gift'
            || ($session['id'] ?? null) !== $gift->stripe_session_id
            || ($session['mode'] ?? '') !== 'payment' || ($session['payment_status'] ?? '') !== 'paid'
            || ($session['currency'] ?? '') !== 'eur' || ($session['amount_total'] ?? null) !== $gift->amount
            || ! is_string($session['payment_intent'] ?? null) || ! str_starts_with($session['payment_intent'], 'pi_')) {
            return;
        }

        static::whereKey($gift->id)->whereNull('paid_at')->whereNull('revoked_at')->update([
            'paid_at' => now(), 'stripe_payment_intent_id' => $session['payment_intent'],
        ]);
    }

    /** A full refund or dispute removes only this entitlement, never a separately paid subscription. */
    public static function revoke(array $object, bool $dispute = false): void
    {
        $intent = $object['payment_intent'] ?? null;
        if (! is_string($intent) || ! str_starts_with($intent, 'pi_') || (! $dispute && ! ($object['refunded'] ?? false))) {
            return;
        }

        $gift = static::where('stripe_payment_intent_id', $intent)->first();
        if ($gift && static::whereKey($gift->id)->whereNull('revoked_at')->update(['revoked_at' => now()])) {
            $gift->recipient?->announce();
        }
    }

    public function activate(User $user): void
    {
        abort_unless($this->recipient_id === $user->id, 403);

        DB::transaction(function () use ($user) {
            // Serialize all activations for a recipient, including different gifts claimed at once.
            $recipient = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $gift = static::whereKey($this->id)->lockForUpdate()->firstOrFail();
            if (! $gift->paid_at || $gift->revoked_at || ! isset(Plans::TIERS[$gift->plan])) {
                throw ValidationException::withMessages(['gift' => 'This gift is not available to activate.']);
            }
            if ($gift->activated_at) {
                return;
            }
            if ($recipient->directPlan()) {
                throw ValidationException::withMessages(['gift' => 'Your gift is saved. Activate it after your current subscription ends; existing billing stays unchanged.']);
            }

            $active = $recipient->activeSubscriptionGifts;
            if ($active->isNotEmpty()) {
                throw ValidationException::withMessages(['gift' => 'Your gift is saved. Activate it after your current gifted plan ends.']);
            }
            $gift->forceFill(['activated_at' => now(), 'expires_at' => now()->addMonthNoOverflow()])->save();
        });

        $user->unsetRelation('activeSubscriptionGifts');
        $user->announce();
    }

    /** Private history is explicitly shaped: no provider identifiers or account emails are sent to the page. */
    public function summary(): array
    {
        return [
            'id' => $this->id, 'plan' => $this->plan, 'name' => Plans::TIERS[$this->plan]['name'],
            'sender' => $this->sender?->only('id', 'name', 'username'),
            'recipient' => $this->recipient?->only('id', 'name', 'username'),
            'price' => Plans::price($this->amount),
            'status' => $this->revoked_at ? 'revoked' : (! $this->paid_at ? 'pending' : (! $this->activated_at ? 'ready' : ($this->expires_at->isFuture() ? 'active' : 'expired'))),
            'expires_at' => $this->expires_at?->toIso8601String(),
        ];
    }
}
