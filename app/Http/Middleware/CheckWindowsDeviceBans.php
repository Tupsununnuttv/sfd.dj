<?php

namespace App\Http\Middleware;

use App\Models\DeviceBan;
use App\Support\DeviceIdentity;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckWindowsDeviceBans
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($device = DeviceIdentity::windows($request)) {
            abort_if(DeviceBan::where('kind', 'windows')->where('device_hash', $device['device_hash'])->exists(), 403, 'This device has been banned from SFD-DJ.EU.');
        }

        return $next($request);
    }
}
