<?php

// seed-shop verifies testing + the exact disposable database before touching fixtures.
require __DIR__.'/seed-shop.php';
$user = \App\Models\User::where('email', 'chromium@browser-test.invalid')->firstOrFail();
$user->forceFill(['plan' => 'premium', 'plan_until' => now()->addYear(), 'preferences' => []])->save();
$room = $user->rooms()->where('slug', 'browser-shop-chromium')->firstOrFail();
$room->update(['current_item_id' => null, 'current_started_at' => null]);
$room->items()->delete();
$room->enqueue(['youtube_id' => 'abcdefghijk', 'title' => 'Subscription visual test song', 'duration' => 3600], $user->id);
echo "Subscription fixtures ready.\n";
