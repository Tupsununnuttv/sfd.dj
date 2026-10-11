<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Sanctum\PersonalAccessToken;

/** Settings → Developers: bot accounts and API tokens (for the API under /api/v1). */
class DeveloperController extends Controller
{
    private const MAX_BOTS = 5;

    private const MAX_TOKENS = 10; // per account

    public function index(Request $request): Response
    {
        $me = $request->user();
        $tokens = fn (User $u) => $u->tokens()->latest()->get(['id', 'name', 'last_used_at', 'created_at']);

        return Inertia::render('Settings/Developers', [
            'tokens' => $tokens($me),
            'bots' => $me->bots()->get()->map(fn (User $b) => $b->only('id', 'name', 'username') + ['tokens' => $tokens($b)])->values(),
            'newToken' => session('new_token'), // shown once, right after it was made
            'api' => url('/api/v1'),
        ]);
    }

    /** A bot is a user nobody can log in as; it acts only through its tokens, with the rights its room roles give it. */
    public function storeBot(Request $request): RedirectResponse
    {
        $me = $request->user();
        abort_if($me->is_bot, 403);
        $name = $request->validate(['name' => ['required', 'string', 'min:2', 'max:30']])['name'];

        if ($me->bots()->count() >= self::MAX_BOTS) {
            throw ValidationException::withMessages(['name' => 'You can have at most '.self::MAX_BOTS.' bots.']);
        }

        $base = 'bot_'.Str::substr(preg_replace('/[^a-z0-9]+/', '_', Str::lower(Str::ascii($name))), 0, 12);
        do {
            $username = trim($base, '_').'_'.Str::lower(Str::random(4));
        } while (User::whereRaw('lower(username) = ?', [$username])->exists());

        $bot = new User(['name' => $name, 'username' => $username, 'email' => $username.'@bots.invalid', 'password' => Str::random(48)]);
        $bot->forceFill(['is_bot' => true, 'bot_owner_id' => $me->id, 'character' => 'char:robo', 'email_verified_at' => now()])->save();

        return back()->with('new_token', ['for' => $bot->name, 'token' => $bot->createToken('first token')->plainTextToken]);
    }

    public function destroyBot(Request $request, User $bot): RedirectResponse
    {
        abort_unless($bot->is_bot && $bot->bot_owner_id === $request->user()->id, 403);

        $bot->tokens()->delete();
        $bot->delete();

        return back();
    }

    /** A new token for yourself, or for one of your bots (`bot_id`). The text is shown once and never stored. */
    public function storeToken(Request $request): RedirectResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:40'], 'bot_id' => ['nullable', 'integer']]);
        $owner = isset($data['bot_id']) ? $request->user()->bots()->findOrFail($data['bot_id']) : $request->user();

        if ($owner->tokens()->count() >= self::MAX_TOKENS) {
            throw ValidationException::withMessages(['name' => 'That account already has '.self::MAX_TOKENS.' tokens. Delete one first.']);
        }

        return back()->with('new_token', ['for' => $owner->name, 'token' => $owner->createToken($data['name'])->plainTextToken]);
    }

    public function destroyToken(Request $request, int $token): RedirectResponse
    {
        $me = $request->user();
        $owners = $me->bots()->pluck('id')->push($me->id);

        PersonalAccessToken::where('tokenable_type', User::class)->whereIn('tokenable_id', $owners)->whereKey($token)->delete();

        return back();
    }
}
