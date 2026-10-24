<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\SubscriptionPerks;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SubscriptionPerksController extends Controller
{
    private function publish(User $user): void
    {
        $user->refresh()->announce();
        foreach ($user->rooms()->pluck('id') as $id) \App\Events\RoomUpdated::dispatch($id);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $rules = [];
        foreach (SubscriptionPerks::CONTROLS as $field => [$feature, , $type]) {
            $rules[$field] = ['sometimes', 'nullable', 'string', 'max:'.($type === 'links' ? 1500 : 180)];
            if (is_array($type)) $rules[$field][] = Rule::in(['', ...SubscriptionPerks::options($user->activePlan(), $field)]);
            if ($type === 'color') $rules[$field][] = 'regex:/^#[0-9a-fA-F]{6}$/';
        }
        $data = $request->validate($rules);
        foreach ($data as $field => $value) {
            if (filled($value) && ! SubscriptionPerks::allows($user, SubscriptionPerks::CONTROLS[$field][0])) {
                throw ValidationException::withMessages([$field => 'Your current subscription does not include this feature.']);
            }
        }
        if (filled($data['music'] ?? null)) {
            $links = preg_split('/\R/', trim($data['music']));
            if (count($links) > 5 || collect($links)->contains(fn ($url) => ! filter_var($url, FILTER_VALIDATE_URL) || parse_url($url, PHP_URL_SCHEME) !== 'https' || ! in_array(strtolower((string) parse_url($url, PHP_URL_HOST)), ['youtube.com', 'www.youtube.com', 'youtu.be', 'soundcloud.com', 'www.soundcloud.com', 'open.spotify.com'], true))) {
                throw ValidationException::withMessages(['music' => 'Use up to five HTTPS YouTube, SoundCloud or Spotify links, one per line.']);
            }
        }
        if (filled($data['badges'] ?? null)) {
            $keys = array_filter(array_map('trim', explode(',', $data['badges'])));
            if (array_diff($keys, array_column($user->badges, 'key'))) throw ValidationException::withMessages(['badges' => 'Choose only badges you own.']);
        }
        DB::transaction(function () use ($user, $data) {
            $fresh = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $preferences = $fresh->preferences ?? [];
            $preferences['subscription'] = array_replace($preferences['subscription'] ?? [], array_map(fn ($value) => $value ?? '', $data));
            $fresh->forceFill(['preferences' => $preferences])->save();
        });
        $this->publish($user);
        return back();
    }

    public function background(Request $request)
    {
        $user = $request->user();
        abort_unless(SubscriptionPerks::allows($user, 'profile_background'), 403);
        $request->validate(['image' => ['required', 'image', 'mimes:png,jpg,jpeg,webp,gif', 'max:4096', 'dimensions:max_width=4096,max_height=4096']]);
        if ($request->file('image')->getMimeType() === 'image/gif') abort_unless(SubscriptionPerks::allows($user, 'animated_background'), 403);
        $file = MediaController::store($request->file('image'), 'avatars');
        $old = DB::transaction(function () use ($user, $file) {
            $fresh = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $preferences = $fresh->preferences ?? [];
            $old = $preferences['subscription']['image'] ?? null;
            $preferences['subscription']['image'] = $file;
            $fresh->forceFill(['preferences' => $preferences])->save();
            return $old;
        });
        if ($old) MediaController::disk()->delete('avatars/'.basename($old));
        $this->publish($user);
        return back();
    }

    public function removeBackground(Request $request)
    {
        $old = DB::transaction(function () use ($request) {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $preferences = $user->preferences ?? [];
            $old = $preferences['subscription']['image'] ?? null;
            unset($preferences['subscription']['image']);
            $user->forceFill(['preferences' => $preferences])->save();
            return $old;
        });
        if ($old) MediaController::disk()->delete('avatars/'.basename($old));
        $this->publish($request->user());
        return back();
    }
}
