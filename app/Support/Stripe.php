<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Payments for the plans through Stripe, spoken to directly over its API (no SDK). Off until STRIPE_SECRET is in .env: then a plan is bought on a
 * Stripe Checkout page, changed or cancelled on Stripe's billing page, and Stripe tells the site what happened through the webhook (STRIPE_WEBHOOK_SECRET).
 */
final class Stripe
{
    private const API = 'https://api.stripe.com/v1/';

    public static function on(): bool
    {
        return filled(config('services.stripe.secret'));
    }

    /** @return array{status: 'ok'|'warn', message: string} */
    public static function apiHealth(): array
    {
        if (! self::on()) {
            return ['status' => 'warn', 'message' => 'STRIPE_SECRET is missing. Add a test key locally or a live key to the production environment.'];
        }

        try {
            $response = Http::withToken((string) config('services.stripe.secret'))
                ->acceptJson()
                ->connectTimeout(2)
                ->timeout(3)
                ->get(self::API.'account');
        } catch (ConnectionException) {
            return ['status' => 'warn', 'message' => 'Stripe could not be reached. Check the server connection and try again.'];
        }

        if ($response->successful()) {
            return ['status' => 'ok', 'message' => 'Stripe accepted the API key and the account check succeeded. The key itself is never shown here.'];
        }

        return match ($response->status()) {
            401 => ['status' => 'warn', 'message' => 'Stripe rejected STRIPE_SECRET. Check that it is current and belongs to this environment.'],
            403 => ['status' => 'warn', 'message' => 'This restricted key cannot read the Stripe account. Grant Account: Read for this health check, and ensure Checkout Session and Billing Portal Session write permissions are enabled.'],
            default => ['status' => 'warn', 'message' => 'Stripe returned HTTP '.$response->status().' during the account check. Check Stripe Workbench request logs.'],
        };
    }

    /** A Stripe Checkout page where the person pays for the plan, by the month or the year. Returns its address. */
    public static function checkout(User $user, string $plan, string $interval): string
    {
        $tier = Plans::TIERS[$plan];
        $tag = ['user_id' => $user->id, 'plan' => $plan];

        return self::post('checkout/sessions', [
            'mode' => 'subscription',
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => 'eur',
                    'unit_amount' => $tier[$interval],
                    'recurring' => ['interval' => $interval],
                    'product_data' => ['name' => "SFD-DJ.EU {$tier['name']}"],
                ],
            ]],
            'client_reference_id' => $user->id,
            'customer' => $user->stripe_customer_id,
            'customer_email' => $user->stripe_customer_id ? null : $user->email,
            'metadata' => $tag,
            'subscription_data' => ['metadata' => $tag],
            'success_url' => route('settings.plus', ['paid' => 1]),
            'cancel_url' => route('settings.plus'),
        ])['url'];
    }

    /** Stripe's own page where the person changes the card, switches between month and year, or cancels. Returns its address. */
    public static function portal(User $user): string
    {
        return self::post('billing_portal/sessions', ['customer' => $user->stripe_customer_id, 'return_url' => route('settings.plus')])['url'];
    }

    /** Is this webhook call really from Stripe? The Stripe-Signature header is "t=<time>,v1=<HMAC-SHA256 of "<time>.<body>">", at most five minutes old. */
    public static function signed(string $payload, string $header, string $secret, int $tolerance = 300): bool
    {
        $time = 0;
        $signatures = [];
        foreach (explode(',', $header) as $part) {
            [$key, $value] = array_pad(explode('=', trim($part), 2), 2, '');
            $key === 't' && $time = (int) $value;
            $key === 'v1' && $signatures[] = $value;
        }

        if (! $time || ! $signatures || abs(time() - $time) > $tolerance) {
            return false;
        }

        $expected = hash_hmac('sha256', "{$time}.{$payload}", $secret);

        return collect($signatures)->contains(fn ($s) => hash_equals($expected, $s));
    }

    /** What Stripe says about a subscription (bought, renewed, cancelled, ended): the person's plan follows it. */
    public static function apply(array $subscription, bool $deleted = false): void
    {
        $user = User::find($subscription['metadata']['user_id'] ?? 0) ?? User::where('stripe_customer_id', $subscription['customer'] ?? '')->first();
        $plan = $subscription['metadata']['plan'] ?? $user?->plan;

        if (! $user || ! isset(Plans::TIERS[$plan])) {
            return;
        }

        $item = $subscription['items']['data'][0] ?? [];
        $end = $subscription['current_period_end'] ?? $item['current_period_end'] ?? null; // newer API versions keep the period on the item
        $live = ! $deleted && in_array($subscription['status'] ?? '', ['active', 'trialing', 'past_due'], true);

        $user->forceFill([
            'plan' => $plan,
            'plan_until' => $live ? ($end ? now()->setTimestamp($end) : now()->addMonth()) : now(),
            'plan_interval' => $item['price']['recurring']['interval'] ?? $user->plan_interval,
            'plan_renews' => $live && ! ($subscription['cancel_at_period_end'] ?? false),
            'stripe_customer_id' => $subscription['customer'] ?? $user->stripe_customer_id,
            'stripe_subscription_id' => $subscription['id'] ?? $user->stripe_subscription_id,
        ])->save();
        $user->announce(); // the gem shows (or goes) in the rooms they are in at once
    }

    private static function post(string $path, array $form): array
    {
        return Http::asForm()->withToken((string) config('services.stripe.secret'))->post(self::API.$path, array_filter($form, fn ($v) => $v !== null))->throw()->json();
    }
}
