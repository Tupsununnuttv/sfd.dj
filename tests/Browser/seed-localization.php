<?php
require __DIR__.'/seed-perks.php';
$user->forceFill(['roles' => ['owner']])->save();
\App\Models\SitePermission::where('role', 'helper')->where('permission', 'users.roles')->delete();
\App\Models\SitePermission::forget();
$room->update(['name' => 'Friends']);
$writer = \App\Models\User::firstOrCreate(['email' => 'original-content@browser-test.invalid'], ['name' => 'Dashboard', 'username' => 'original_content', 'password' => \Illuminate\Support\Facades\Hash::make('Fixture-Only-991!')]);
$room->messages()->firstOrCreate(['user_id' => $writer->id, 'body' => 'Settings'], ['type' => 'user']);
