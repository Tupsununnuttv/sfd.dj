<?php

namespace App\Models;

use Database\Factories\DonationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A donation to the project, paid on a Stripe Checkout page. It counts towards the donation goal once Stripe says it is paid. */
class Donation extends Model
{
    /** @use HasFactory<DonationFactory> */
    use HasFactory;

    protected $fillable = ['user_id', 'room_id', 'amount', 'anonymous', 'stripe_session_id', 'paid_at'];

    protected function casts(): array
    {
        return ['amount' => 'integer', 'anonymous' => 'boolean', 'paid_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /** Everything given on the site so far, in euro. */
    public static function raised(): float
    {
        return static::whereNotNull('paid_at')->sum('amount') / 100;
    }

    /**
     * Stripe says a Checkout page was paid (checkout.session.completed, or async_payment_succeeded for slower payment methods): the donation counts
     * from now on and the room it came from says thank you. Stripe may send the same event twice; only the first one does anything.
     */
    public static function settle(array $session): void
    {
        $donation = static::find($session['metadata']['donation_id'] ?? 0);

        if (! $donation || ($session['payment_status'] ?? '') !== 'paid') {
            return;
        }

        $amount = (int) ($session['amount_total'] ?? $donation->amount);
        if (! static::whereKey($donation->id)->whereNull('paid_at')->update(['paid_at' => now(), 'amount' => $amount])) {
            return;
        }

        $room = $donation->room;
        $actor = $donation->anonymous ? $room?->user : $donation->user; // an anonymous gift is told by the room itself, so nobody's name or picture shows
        if ($room && $actor) {
            $who = $donation->anonymous || ! $donation->user ? 'Someone' : $donation->user->name;
            ChatMessage::system($room, 'donation', sprintf('%s donated €%s to help SFD-DJ.EU grow. Thank you!', $who, number_format($amount / 100, 2)), $actor);
        }
    }
}
