<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Support\PumpkinHunt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PumpkinHuntController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $data = $request->validate([
            'page' => ['nullable', 'string', Rule::in(PumpkinHunt::PAGES), 'prohibits:room_slug'],
            'room_slug' => ['nullable', 'string', 'max:255', 'prohibits:page'],
        ]);
        $room = isset($data['room_slug']) ? Room::atAddress($data['room_slug'])->firstOrFail() : null;

        return response()->json(PumpkinHunt::payload($request->user(), $data['page'] ?? null, $room))
            ->header('Cache-Control', 'private, no-store');
    }

    public function claim(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'max:4096']]);

        return response()->json(PumpkinHunt::claim($request->user(), $data['token']))
            ->header('Cache-Control', 'private, no-store');
    }
}
