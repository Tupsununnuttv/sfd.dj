<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use App\Models\Room;
use App\Models\Setting;
use App\Support\Stripe;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DonationController extends Controller
{
    /**
     * Donate: any amount from €1 to €1,000, named or anonymous. With Stripe connected it is paid on a Stripe Checkout page and comes back to the room;
     * without it, the donation page set in Community settings (Ko-fi, PayPal ...) opens instead, where the amount is chosen again.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:1000'],
            'anonymous' => ['boolean'],
            'room' => ['nullable', 'string', 'exists:rooms,slug'],
        ]);

        if (! Stripe::on()) {
            $elsewhere = (string) Setting::get('donation.url', '');
            abort_if($elsewhere === '', 503, 'Donations are not open yet.');

            return response()->json(['url' => $elsewhere, 'stripe' => false]);
        }

        $room = isset($data['room']) ? Room::where('slug', $data['room'])->first() : null;
        $donation = Donation::create([
            'user_id' => $request->user()->id,
            'room_id' => $room?->id,
            'amount' => (int) round($data['amount'] * 100),
            'anonymous' => $data['anonymous'] ?? false,
        ]);

        try {
            $session = Stripe::donation($donation, $room ? route('rooms.show', $room) : route('dashboard'));
        } catch (ConnectionException|RequestException) {
            $donation->delete();
            abort(502, 'Stripe could not open the payment page. Please try again in a moment.');
        }

        $donation->update(['stripe_session_id' => $session['id']]);

        return response()->json(['url' => $session['url'], 'stripe' => true]);
    }
}
