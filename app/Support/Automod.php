<?php

namespace App\Support;

use App\Models\Room;
use App\Models\User;

/** Room chat filters. Returns why a message is blocked, or null when it may pass. People who moderate chat are exempt. */
class Automod
{
    public const DEFAULTS = ['enabled' => false, 'links' => false, 'caps' => false, 'repeat' => false, 'words' => []];

    public static function settings(Room $room): array
    {
        return array_replace(self::DEFAULTS, $room->automod ?? []);
    }

    public static function check(Room $room, User $user, string $body): ?string
    {
        $cfg = self::settings($room);

        if (! $cfg['enabled'] || $body === '' || $room->can($user, 'moderate_chat')) {
            return null;
        }

        // emote tokens like :7tv:ID: are not text
        $text = trim(preg_replace('/:(?:bttv|7tv):\w+:/', '', $body));

        if ($cfg['links'] && preg_match('~(https?://|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|io|gg|tv|ly|me|xyz|ru|cn)\b~i', $text)) {
            return 'links are not allowed here';
        }

        if ($cfg['caps']) {
            $letters = preg_match_all('/\p{L}/u', $text);
            if ($letters >= 8 && preg_match_all('/\p{Lu}/u', $text) / $letters > 0.7) {
                return 'too many capital letters';
            }
        }

        if ($cfg['repeat'] && $room->messages()->where('user_id', $user->id)->where('type', 'user')->where('body', $body)->where('created_at', '>', now()->subSeconds(30))->exists()) {
            return 'please do not repeat yourself';
        }

        foreach ($cfg['words'] as $word) {
            if ($word !== '' && preg_match('/(?<![\p{L}\p{N}])'.preg_quote($word, '/').'(?![\p{L}\p{N}])/iu', $text)) {
                return 'that word is not allowed here';
            }
        }

        return null;
    }
}
