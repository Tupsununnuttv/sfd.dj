<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** "Is this username free?" for the register and profile forms. Usernames are public anyway, so anyone may ask (rate limited). */
class UsernameController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $name = trim((string) $request->query('username'));

        if (strlen($name) < 3 || strlen($name) > 20 || ! preg_match('/^[A-Za-z0-9_]+$/', $name)) {
            return response()->json(['available' => false, 'message' => '3 to 20 letters, numbers or underscores.']);
        }

        $taken = User::whereRaw('lower(username) = ?', [mb_strtolower($name)])->when($request->user(), fn ($q, $me) => $q->where('id', '!=', $me->id))->exists();

        return response()->json(['available' => ! $taken, 'message' => $taken ? 'That username is taken.' : 'Available.']);
    }
}
