<?php

namespace App\Support;

use Illuminate\Http\Request;

/** Identifiers are abuse signals, never authentication or authorization credentials. */
class DeviceIdentity
{
    public const COOKIE = 'sfd_device';

    public static function hash(string $kind, string $value): string
    {
        return hash_hmac('sha256', $kind.'|'.$value, config('app.key'));
    }

    public static function windows(Request $request): ?array
    {
        $value = $request->header('X-SFD-Device-Id', '');
        if (! is_string($value) || ! preg_match('/\A[a-f0-9]{64}\z/D', $value)) {
            return null;
        }
        $source = $request->header('X-SFD-Device-Source');

        return ['kind' => 'windows', 'device_hash' => self::hash('windows', $value), 'source' => in_array($source, ['tpm', 'uefi', 'registry'], true) ? $source : null];
    }
}
