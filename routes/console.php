<?php

use App\Models\WhisperCall;
use Illuminate\Foundation\DevCommands;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Schedule::call(fn () => WhisperCall::expire())->everyMinute()->name('expire-whisper-calls')->withoutOverlapping();

DevCommands::artisan('reverb:start', 'reverb');

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
