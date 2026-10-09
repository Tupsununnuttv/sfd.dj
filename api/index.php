<?php

// The live site on Vercel runs PHP from api/ (vercel.json sends every request that is not a static file here): hand it to Laravel's front door.
require __DIR__.'/../public/index.php';
