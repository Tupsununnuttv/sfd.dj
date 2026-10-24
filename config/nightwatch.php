<?php

return [
    // An unconfigured agent otherwise adds its connection timeout to every PHP request.
    // Explicit NIGHTWATCH_ENABLED still takes precedence for configured installations.
    'enabled' => env('NIGHTWATCH_ENABLED', filled(env('NIGHTWATCH_TOKEN'))),
];
