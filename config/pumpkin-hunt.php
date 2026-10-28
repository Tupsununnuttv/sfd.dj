<?php

return [
    'enabled' => env('PUMPKIN_HUNT_ENABLED', true),
    // Each year's hunt runs from 20 October through 7 November, inclusive.
    'starts_on' => '10-20',
    'ends_before' => '11-08',
    'token_minutes' => 15,
];
