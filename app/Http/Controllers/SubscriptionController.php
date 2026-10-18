<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use App\Models\SubscriptionGift;
use App\Models\User;
use App\Support\Plans;
use App\Support\Stripe;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/** SFD-DJ.EU Subscriptions (Bronze, Silver, Gold, Plus, Pro and Premium): Settings → Subscriptions, buying a plan on Stripe, managing it there, and what Stripe tells us back. */
class SubscriptionController extends Controller
{
    public function show(Request $request): InertiaResponse
    {
        $me = $request->user();
        $active = $me->activePlan();
        $gifted = $active && $active !== $me->directPlan();
        $giftUntil = $gifted ? $me->activeSubscriptionGifts->where('plan', $active)->sortByDesc('expires_at')->first()?->expires_at : null;

        return Inertia::render('Settings/Plus', [
            'plans' => Plans::catalog(),
            'free' => Plans::FREE,
            'mine' => $active ? [
                'key' => $active,
                'name' => Plans::TIERS[$active]['name'],
                'until' => ($gifted ? $giftUntil : $me->plan_until)?->toIso8601String(),
                'interval' => $gifted ? null : $me->plan_interval,
                'renews' => ! $gifted && (bool) $me->plan_renews,
                'gifted' => $gifted,
            ] : null,
            'manageable' => filled($me->stripe_customer_id) && Stripe::on(), // paid through Stripe: Stripe's page changes or cancels it
            'payments' => Stripe::on(),
            'paid' => $request->boolean('paid'), // back from Stripe Checkout
            'giftPayments' => Stripe::giftsOn(),
            'giftSent' => $request->boolean('gift_sent'),
            'giftRecipient' => User::where('id', $request->integer('recipient'))->where('id', '!=', $me->id)->where('is_bot', false)->first()?->only('id', 'name', 'username'),
            'receivedGifts' => SubscriptionGift::where('recipient_id', $me->id)->whereNotNull('paid_at')->with(['sender', 'recipient'])->latest()->limit(50)->get()->map->summary(),
            'sentGifts' => SubscriptionGift::where('sender_id', $me->id)->with(['sender', 'recipient'])->latest()->limit(30)->get()->map->summary(),
        ]);
    }

    /** Off to Stripe Checkout to pay for a plan. */
    public function checkout(Request $request): HttpResponse
    {
        $data = $request->validate([
            'plan' => ['required', Rule::in(array_keys(Plans::TIERS))],
            'interval' => ['required', Rule::in(['month', 'year'])],
        ]);
        abort_unless(Stripe::on(), 503, 'Payments are not connected yet.');

        return Inertia::location(Stripe::checkout($request->user(), $data['plan'], $data['interval']));
    }

    /** Off to Stripe's billing page: change the card, switch month and year, or cancel. */
    public function portal(Request $request): HttpResponse
    {
        abort_unless(Stripe::on() && filled($request->user()->stripe_customer_id), 404);

        return Inertia::location(Stripe::portal($request->user()));
    }

    /** Stripe tells us a plan was bought, renewed, changed, cancelled or has ended. Only calls signed with STRIPE_WEBHOOK_SECRET count. */
    public function webhook(Request $request): Response
    {
        $secret = (string) config('services.stripe.webhook_secret');
        abort_unless($secret !== '' && Stripe::signed($request->getContent(), (string) $request->header('Stripe-Signature'), $secret), 400, 'Bad signature.');

        $event = json_decode($request->getContent(), true) ?: [];
        $object = $event['data']['object'] ?? [];

        match ($event['type'] ?? '') {
            'customer.subscription.created', 'customer.subscription.updated' => Stripe::apply($object),
            'customer.subscription.deleted' => Stripe::apply($object, deleted: true),
            'checkout.session.completed', 'checkout.session.async_payment_succeeded' => match ($object['metadata']['kind'] ?? '') {
                'donation' => Donation::settle($object),
                'subscription_gift' => SubscriptionGift::settle($object),
                default => null,
            },
            'charge.refunded' => SubscriptionGift::revoke($object),
            'charge.dispute.created' => SubscriptionGift::revoke($object, dispute: true),
            default => null,
        };

        return response()->noContent();
    }
}
