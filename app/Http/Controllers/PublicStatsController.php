<?php

namespace App\Http\Controllers;

use App\Support\PublicStats;
use Illuminate\Http\JsonResponse;

class PublicStatsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json(PublicStats::get())->header('Cache-Control', 'no-store, private');
    }
}
