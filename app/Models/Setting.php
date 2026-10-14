<?php

namespace App\Models;

use App\Support\MailStatus;
use App\Support\Stripe;
use Illuminate\Database\Eloquent\Model;

/** Tiny key/value store for site switches such as maintenance mode. */
class Setting extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $primaryKey = 'key';

    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    public static function get(string $key, ?string $default = null): ?string
    {
        return static::find($key)?->value ?? $default;
    }

    /** Services people can be linked to from the room footbar. key => label */
    public const SOCIALS = ['discord' => 'Discord', 'instagram' => 'Instagram', 'youtube' => 'YouTube', 'x' => 'X', 'tiktok' => 'TikTok', 'twitch' => 'Twitch', 'facebook' => 'Facebook'];

    /** Social links (only the filled ones) and the donation goal, for every page. */
    public static function community(): array
    {
        $all = static::where('key', 'like', 'social.%')->orWhere('key', 'like', 'donation.%')->pluck('value', 'key');
        $goal = (float) ($all['donation.goal'] ?? 0);
        $current = round((float) ($all['donation.current'] ?? 0) + Donation::raised(), 2); // raised elsewhere (typed in by staff) + given on the site

        return [
            'social' => collect(self::SOCIALS)->mapWithKeys(fn ($label, $key) => [$key => $all["social.$key"] ?? ''])->filter()->all(),
            'donate' => Stripe::on() || filled($all['donation.url'] ?? ''), // can the Donate button take a donation (Stripe, or a page elsewhere)?
            'donation' => ($all['donation.enabled'] ?? '0') === '1' && $goal > 0 ? [
                'title' => $all['donation.title'] ?? 'Keep SFD-DJ.EU running',
                'goal' => $goal,
                'current' => $current,
                'percent' => (int) min(100, round($current / $goal * 100)),
                'currency' => $all['donation.currency'] ?? '€',
                'url' => $all['donation.url'] ?? '',
            ] : null,
        ];
    }

    /**
     * Must people confirm their email before they can chat, vote and DJ? Staff decide (Admin panel → Email; "required" until they say otherwise), but it is only asked for
     * while this site can really send email: when it cannot, the message never comes, so everybody just gets in.
     */
    public static function verificationRequired(): bool
    {
        return (static::get('email_verification') ?? 'required') === 'required' && MailStatus::configured();
    }

    public static function put(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
