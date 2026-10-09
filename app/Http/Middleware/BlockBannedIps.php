<?php

namespace App\Http\Middleware;

use App\Models\IpBan;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockBannedIps
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_if(IpBan::where('ip', $request->ip())->exists(), 403, 'Your IP address has been banned from SFD.DJ.');

        return $next($request);
    }
}
