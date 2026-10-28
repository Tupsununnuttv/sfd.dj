<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'youtube' => [
        'key' => env('YOUTUBE_API_KEY'),
        'client_id' => env('YOUTUBE_CLIENT_ID'),
        'client_secret' => env('YOUTUBE_CLIENT_SECRET'),
    ],

    'spotify' => [
        'client_id' => env('SPOTIFY_CLIENT_ID'),
        'client_secret' => env('SPOTIFY_CLIENT_SECRET'),
    ],

    // Lets people link their Discord account (Settings → Account). Create the app at discord.com/developers.
    'discord' => [
        'client_id' => env('DISCORD_CLIENT_ID'),
        'client_secret' => env('DISCORD_CLIENT_SECRET'),
        'bot_token' => env('DISCORD_BOT_TOKEN'),
        'guild_id' => env('DISCORD_GUILD_ID'),
        'role_prefix' => env('DISCORD_ROLE_PREFIX', 'SFD-DJ.EU | '),
        'member_role_id' => env('DISCORD_MEMBER_ROLE_ID'),
        'staff_applications_channel_id' => env('DISCORD_STAFF_APPLICATIONS_CHANNEL_ID'),
        'staff_role_id' => env('DISCORD_STAFF_ROLE_ID'),
        'approved_staff_role_id' => env('DISCORD_APPROVED_STAFF_ROLE_ID'),
        // The Discord channels an applicant reads first: blue links on the staff application page, and in the message to the staff. The label is the channel's name.
        // The questions themselves are in App\Support\StaffApplicationForm.
        'staff_application_links' => [
            ['label' => '#staff-requirements', 'url' => 'https://discord.com/channels/827767815452753950/827776116851736628'],
            ['label' => '#staff-application-questions', 'url' => 'https://discord.com/channels/827767815452753950/827776072551759912'],
        ],
    ],

    // Activities can belong to a different application from the website's Discord login/bot.
    'discord_activity' => [
        'client_id' => env('DISCORD_ACTIVITY_CLIENT_ID', '1563979983582535841'),
        'client_secret' => env('DISCORD_ACTIVITY_CLIENT_SECRET'),
    ],

    'twitch' => [
        'client_id' => env('TWITCH_CLIENT_ID'),
        'client_secret' => env('TWITCH_CLIENT_SECRET'),
    ],

    'tiktok' => [
        'client_id' => env('TIKTOK_CLIENT_KEY'),
        'client_secret' => env('TIKTOK_CLIENT_SECRET'),
    ],

    'giphy' => [
        'api_key' => env('GIPHY_API_KEY'),
        'sdk_key' => env('GIPHY_SDK_API_KEY'),
    ],
    'reddit' => [
        'client_id' => env('REDDIT_CLIENT_ID'), 'client_secret' => env('REDDIT_CLIENT_SECRET'),
        'user_agent' => env('REDDIT_USER_AGENT', 'web:SFD-DJ.EU:1.0 (account linking)'),
    ],
    'instagram' => ['client_id' => env('INSTAGRAM_CLIENT_ID'), 'client_secret' => env('INSTAGRAM_CLIENT_SECRET')],
    'facebook' => [
        'client_id' => env('FACEBOOK_CLIENT_ID'), 'client_secret' => env('FACEBOOK_CLIENT_SECRET'),
        'graph_version' => env('META_GRAPH_VERSION', 'v25.0'),
    ],
    'x' => ['client_id' => env('X_CLIENT_ID'), 'client_secret' => env('X_CLIENT_SECRET')],

    // Legacy Tenor endpoint; the chat GIF picker now uses GIPHY directly from the browser.
    // payments for the SFD-DJ.EU subscriptions (App\Support\Stripe): the secret key and the signing secret of the webhook /stripe/webhook
    'stripe' => [
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

    'tenor' => [
        'key' => env('TENOR_API_KEY', env('YOUTUBE_API_KEY')),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
