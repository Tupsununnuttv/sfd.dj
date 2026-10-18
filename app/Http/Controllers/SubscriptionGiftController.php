<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionGift;
use App\Models\User;
use App\Support\Plans;
use App\Support\Stripe;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class SubscriptionGiftController extends Controller
{
    public function recipients(Request $request): JsonResponse
    {
        $data = $request->validate(['q' => ['required', 'string', 'min:2', 'max:60']]);
        $query = str_replace(['%', '_', '\\'], '', ltrim(trim($data['q']), '@'));

        return response()->json(strlen($query) < 2 ? [] : User::where('is_bot', false)->where('id', '!=', $request->user()->id)
            ->where(fn ($q) => $q->where('username', 'like', $query.'%')->orWhere('name', 'like', $query.'%'))
            ->orderBy('username')->limit(8)->get(['id', 'name', 'username'])->map->only('id', 'name', 'username'));
    }

    public function checkout(Request $request): Response
    {
        $data = $request->validate([
            'recipient_id' => ['required', 'integer', Rule::exists('users', 'id')->where('is_bot', false), Rule::notIn([$request->user()->id])],
            'plan' => ['required', Rule::in(array_keys(Plans::TIERS))],
        ]);
        if (! Stripe::giftsOn()) {
            throw ValidationException::withMessages(['gift' => 'Gift payments are not connected yet. Please try again later.']);
        }

        $gift = SubscriptionGift::create([
            'sender_id' => $request->user()->id, 'recipient_id' => $data['recipient_id'],
            'plan' => $data['plan'], 'amount' => Plans::TIERS[$data['plan']]['month'],
        ]);
        try {
            $session = Stripe::gift($gift, $request->user());
        } catch (ConnectionException|RequestException $e) {
            report($e);
            throw ValidationException::withMessages(['gift' => 'Stripe could not open checkout. No gift has been delivered; please try again.']);
        }
        $gift->update(['stripe_session_id' => $session['id']]);

        return Inertia::location($session['url']);
    }

    public function activate(Request $request, SubscriptionGift $gift): RedirectResponse
    {
        $gift->activate($request->user());

        return redirect()->route('settings.plus');
    }
}
