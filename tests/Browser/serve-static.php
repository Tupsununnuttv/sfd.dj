<?php

// Built-in PHP router for production-asset browser checks, isolated by playwright.config.mjs.
$public = realpath(__DIR__.'/../../public');
$path = realpath($public.'/'.rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)));
if ($path && is_file($path) && str_starts_with($path, $public.DIRECTORY_SEPARATOR)) return false;

define('LARAVEL_START', microtime(true));
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Http\Kernel::class)->bootstrap();
if (! $app->environment('testing') || config('database.default') !== 'sqlite'
    || str_replace('\\', '/', config('database.connections.sqlite.database')) !== str_replace('\\', '/', base_path('tmp/browser-tests.sqlite'))) {
    throw new RuntimeException('Static browser fixtures require the dedicated test database.');
}
$app->make(Illuminate\Foundation\Vite::class)->useHotFile(base_path('tmp/browser-no-hot-file'));
$app->handleRequest(Illuminate\Http\Request::capture());
