<?php

use App\Models\Room;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

// Dedicated disposable database only. Never run fixtures against a member database.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$database = config('database.connections.sqlite.database');
if (! app()->environment('testing') || config('database.default') !== 'sqlite'
    || str_replace('\\', '/', $database) !== str_replace('\\', '/', base_path('tmp/browser-tests.sqlite'))) {
    throw new RuntimeException('Shop browser fixtures require testing + tmp/browser-tests.sqlite.');
}
if (! is_file($database)) {
    if (! is_dir(dirname($database))) {
        mkdir(dirname($database), 0777, true);
    }
    touch($database);
}
Artisan::call('migrate', ['--force' => true]);
foreach (['chromium', 'firefox', 'chrome', 'edge', 'opera-gx'] as $project) {
    $user = User::query()->firstOrNew(['email' => $project.'@browser-test.invalid']);
    $user->forceFill([
        'name' => 'Kornelius Browser '.$project, 'username' => 'browser_'.str_replace('-', '_', $project),
        'password' => Hash::make('Browser-Test-Only-9284!'),
        'email_verified_at' => now(), 'xp' => 15860, 'coins' => 5000, 'roles' => ['promoter'], 'country' => 'ES',
        'avatar' => 'img:'.substr(hash('sha256', $project), 0, 24).'.png', 'character' => 'char:foxy', 'cosmetics' => null,
    ])->save();
    $user->items()->delete();
    $room = Room::query()->firstOrCreate(['slug' => 'browser-shop-'.$project], [
        'user_id' => $user->id, 'name' => 'Shop test '.$project, 'background' => 'midnight', 'is_private' => false,
    ]);
    $room->messages()->firstOrCreate(['user_id' => $user->id, 'body' => 'Browser avatar persistence check'], ['type' => 'user']);
}
echo "Dedicated shop browser fixtures ready.\n";
