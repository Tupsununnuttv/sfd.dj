<?php

return [
    // Leave blank for the public-room picker; set a public room's slug for direct entry.
    'room' => env('DISCORD_ACTIVITY_ROOM', 'sfddj'),
    // Mirror these prefixes/targets in the Discord application's URL Mappings.
    // These are provider-owned embed/CDN endpoints; no arbitrary server-side proxy.
    'url_mappings' => [
        ['prefix' => '/_discord/youtube', 'target' => 'www.youtube.com'],
        ['prefix' => '/_discord/youtube-nocookie', 'target' => 'www.youtube-nocookie.com'],
        ['prefix' => '/_discord/ytimg/{subdomain}', 'target' => '{subdomain}.ytimg.com'],
        ['prefix' => '/_discord/soundcloud', 'target' => 'w.soundcloud.com'],
        ['prefix' => '/_discord/sndcdn/{subdomain}', 'target' => '{subdomain}.sndcdn.com'],
        ['prefix' => '/_discord/twitch', 'target' => 'player.twitch.tv'],
        ['prefix' => '/_discord/kick', 'target' => 'player.kick.com'],
        ['prefix' => '/_discord/discord-cdn', 'target' => 'cdn.discordapp.com'],
    ],
];
