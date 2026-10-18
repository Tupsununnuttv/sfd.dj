<?php

return [
    'stun_url' => env('CALL_STUN_URL', 'stun:stun.l.google.com:19302'),
    'turn_url' => env('CALL_TURN_URL'),
    'turn_secret' => env('CALL_TURN_SECRET'),
];
