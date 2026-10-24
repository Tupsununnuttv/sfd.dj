<?php

// seed-shop validates the exact disposable SQLite destination before changing anything.
require __DIR__.'/seed-shop.php';
\Illuminate\Support\Facades\Cache::flush();
foreach (['chromium', 'firefox', 'chrome', 'edge', 'opera-gx', 'brave'] as $project) {
    $host = \App\Models\User::where('email', $project.'@browser-test.invalid')->firstOrFail();
    $host->forceFill(['preferences' => []])->save();
    $bot = \App\Models\User::firstOrCreate(['email' => 'radio-'.$project.'@browser-test.invalid'], [
        'name' => 'Night Radio '.$project, 'username' => 'radio_'.str_replace('-', '_', $project),
        'password' => \Illuminate\Support\Facades\Hash::make('Fixture-Only-Radio-918!'),
    ]);
    $bot->forceFill(['is_bot' => true, 'bot_owner_id' => $host->id])->save();
    $room = $host->rooms()->where('slug', 'browser-shop-'.$project)->firstOrFail();
    $room->update(['name' => 'Shop test '.$project, 'auto_host_bot_id' => $bot->id, 'current_item_id' => null, 'current_started_at' => null, 'live' => null]);
    $room->items()->delete();
}
