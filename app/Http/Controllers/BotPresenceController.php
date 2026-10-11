<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomBotPresence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class BotPresenceController extends Controller
{
    public function join(Request $request, Room $room): JsonResponse
    {
        $bot = $request->user();
        abort_unless($bot->is_bot, 403, 'Only API bots can use bot presence.');

        RoomBotPresence::touchFor($room, $bot);

        return response()->json(['online' => true, 'expires_in' => RoomBotPresence::TTL_SECONDS]);
    }

    public function leave(Request $request, Room $room): Response
    {
        $bot = $request->user();
        abort_unless($bot->is_bot, 403, 'Only API bots can use bot presence.');

        RoomBotPresence::leave($room, $bot);

        return response()->noContent();
    }
}
