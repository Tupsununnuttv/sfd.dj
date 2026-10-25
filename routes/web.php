<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\UsernameController;
use App\Http\Controllers\AutoHostController;
use App\Http\Controllers\AvatarController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\DeveloperController;
use App\Http\Controllers\DiscordActivityController;
use App\Http\Controllers\DiscordController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\EmoteController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\FriendController;
use App\Http\Controllers\LiveController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\MyStuffController;
use App\Http\Controllers\PlaylistController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicStatsController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\RoomEmojiController;
use App\Http\Controllers\RoomModerationController;
use App\Http\Controllers\RoomRoleController;
use App\Http\Controllers\SelfDjBotController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\SpotifyController;
use App\Http\Controllers\StaffApplicationController;
use App\Http\Controllers\StreamConnectionController;
use App\Http\Controllers\SocialConnectionController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\SubscriptionGiftController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\TwoFactorController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\UserRestrictionController;
use App\Http\Controllers\WhisperCallController;
use App\Http\Controllers\WhisperController;
use App\Http\Controllers\WhisperGroupController;
use App\Http\Controllers\YouTubeController;
use App\Http\Middleware\EnsureRoomAccess;
use App\Http\Middleware\VerifiedIfLoggedIn;
use App\Support\Plans;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// The public website. Anyone may read it; it keeps working in maintenance mode only for staff, like everything else.
Route::get('/', [SiteController::class, 'home'])->name('home');
Route::name('site.')->group(function () {
    Route::get('/features', fn () => Inertia::render('Site/Features'))->name('features');
    Route::get('/features/{feature}', fn (string $feature) => Inertia::render('Site/Feature', ['slug' => $feature]))->whereIn('feature', ['rooms', 'music', 'chat', 'moderation', 'roles', 'avatars'])->name('feature');
    Route::get('/about', fn () => Inertia::render('Site/About'))->name('about');
    Route::get('/brand', fn () => Inertia::render('Site/Brand'))->name('brand');
    Route::get('/pricing', fn () => Inertia::render('Site/Pricing', ['plans' => Plans::catalog()]))->name('pricing');
    Route::get('/developers', fn () => Inertia::render('Site/Developers'))->name('developers');
    Route::get('/contact', fn () => Inertia::render('Site/Contact'))->name('contact');
    Route::get('/download', fn () => Inertia::render('Site/Downloads'))->name('downloads');
    Route::get('/legal/{doc}', fn (string $doc) => Inertia::render('Site/Legal', ['slug' => $doc]))->whereIn('doc', ['rules', 'terms', 'privacy'])->name('legal');
});

// The Discord Activity: a light version of the website that Discord opens inside the app (docs/discord-activity.md)
Route::get('/discord', [DiscordActivityController::class, 'show'])->name('discord-activity.show');
Route::post('/discord/token', [DiscordActivityController::class, 'token'])->middleware('throttle:10,1')->name('discord-activity.token');

// Stripe tells the site about paid plans here (signed with STRIPE_WEBHOOK_SECRET; no session, no CSRF token)
Route::post('/stripe/webhook', [SubscriptionController::class, 'webhook'])->name('stripe.webhook');

// the build the site runs now: an open page compares it with its own and offers "New update available" when they differ
Route::get('/version', fn () => response()->json(['version' => Inertia::getVersion()])->header('Cache-Control', 'no-store'))->middleware('throttle:30,1')->name('version');

// is this username free? (the register and profile forms ask while you type)
Route::get('/api/username-available', UsernameController::class)->middleware('throttle:40,1')->name('username.available');
Route::get('/api/site-stats', PublicStatsController::class)->middleware('throttle:120,1,site-stats')->name('site.stats');

Route::get('/two-factor-challenge', [TwoFactorController::class, 'challenge'])->name('two-factor.challenge');
Route::post('/two-factor-challenge', [TwoFactorController::class, 'verify'])->middleware('throttle:6,1,two-factor-verify');

// Logged in but maybe not verified yet: the profile stays reachable so a mistyped email can be fixed.
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/photo', [AvatarController::class, 'upload'])->middleware('throttle:10,1')->name('profile.photo');
    Route::delete('/profile/photo', [AvatarController::class, 'remove'])->name('profile.photo.remove');
    Route::patch('/profile/status', [ProfileController::class, 'status'])->middleware('throttle:30,1')->name('profile.status');
});

// Live support: visitors need no account (their secret token is the key); staff answer from the admin panel.
Route::post('/support/tickets', [SupportController::class, 'open'])->middleware('throttle:5,10')->name('support.open');
Route::get('/support/tickets/{token}', [SupportController::class, 'show'])->middleware('throttle:60,1')->name('support.show');
Route::post('/support/tickets/{token}/messages', [SupportController::class, 'send'])->middleware('throttle:30,1')->name('support.send');

// Pictures people uploaded, served by their random file name. Guests watching a public room see them too.
Route::get('/media/avatar/{file}', [MediaController::class, 'avatar'])->name('media.avatar');
Route::get('/media/chat/{file}', [MediaController::class, 'chat'])->name('media.chat');
Route::get('/media/emoji/{file}', [MediaController::class, 'emoji'])->name('media.emoji');
Route::get('/media/room/{file}', [MediaController::class, 'roomBackground'])->name('media.room');
Route::get('/media/event/{file}', [MediaController::class, 'event'])->name('media.event');
// The characters (public/Avatars/Standing, Dancing and DJing), one picture per state.
Route::get('/characters/{state}/{name}', [AvatarController::class, 'character'])->withoutMiddleware('web')->name('characters.show');

// Pages guests may look at (nobody has to register to browse). Anyone logged in still needs a verified email.
Route::middleware(VerifiedIfLoggedIn::class)->group(function () {
    Route::get('/dashboard', [RoomController::class, 'index'])->name('dashboard');
    Route::get('/live', [LiveController::class, 'index'])->name('live');
    Route::get('/rooms/{room}', [RoomController::class, 'show'])->name('rooms.show');
    Route::get('/rooms/{room}/updates', [RoomController::class, 'updates'])->middleware([EnsureRoomAccess::class, 'throttle:60,1'])->name('rooms.updates');
    Route::get('/rooms/{room}/members', [RoomController::class, 'members'])->middleware('throttle:60,1')->name('rooms.members');
    Route::match(['post', 'delete'], '/rooms/{room}/watchers', [RoomController::class, 'watchers'])->middleware('throttle:room-watchers')->name('rooms.watchers');
    Route::get('/history', [RoomController::class, 'history'])->name('history');
    Route::get('/community', [CommunityController::class, 'index'])->name('community');
    Route::get('/users/{user}', [UserProfileController::class, 'show'])->name('users.show');
    Route::get('/api/users/{user}', [UserProfileController::class, 'card'])->middleware('throttle:120,1')->name('users.card');
    Route::get('/events', [EventController::class, 'index'])->name('events');
    Route::get('/faq', fn () => Inertia::render('Faq'))->name('faq');
    Route::get('/patch-notes', fn () => Inertia::render('PatchNotes'))->name('patch-notes');
    Route::get('/docs', fn () => Inertia::render('Docs'))->name('docs');
});

Route::middleware(['auth', 'verified', 'throttle:30,1'])->group(function () {
    Route::get('/moderation/users/{user}/access', [\App\Http\Controllers\UserAccessController::class, 'show'])->name('moderation.access');
    Route::post('/moderation/users/{user}/ip-ban', [\App\Http\Controllers\UserAccessController::class, 'banIp'])->name('moderation.ip-ban');
    Route::post('/moderation/users/{user}/device-ban', [\App\Http\Controllers\UserAccessController::class, 'banDevice'])->name('moderation.device-ban');
    Route::delete('/moderation/device-bans/{deviceBan}', [\App\Http\Controllers\UserAccessController::class, 'unbanDevice'])->name('moderation.device-unban');
});

// Everything else needs a verified email address.
Route::middleware(['auth', 'verified', EnsureRoomAccess::class])->group(function () {
    Route::get('/staff/apply', [StaffApplicationController::class, 'create'])->name('staff-application.create');
    Route::post('/staff/apply', [StaffApplicationController::class, 'store'])->middleware('throttle:3,60')->name('staff-application.store');

    Route::get('/playlists', [PlaylistController::class, 'index'])->name('playlists');
    Route::get('/selfbots', [SelfDjBotController::class, 'index'])->name('selfbots');
    foreach (SocialConnectionController::PROVIDERS as $provider) {
        Route::get("/auth/{$provider}", [SocialConnectionController::class, 'connect'])->defaults('provider', $provider)->middleware('throttle:10,1')->name("{$provider}.connect");
        Route::get("/auth/{$provider}/callback", [SocialConnectionController::class, 'callback'])->defaults('provider', $provider)->middleware('throttle:20,1')->name("{$provider}.callback");
        Route::delete("/auth/{$provider}", [SocialConnectionController::class, 'disconnect'])->defaults('provider', $provider)->middleware('throttle:10,1')->name("{$provider}.disconnect");
    }
    Route::post('/selfbots', [SelfDjBotController::class, 'store'])->middleware('throttle:10,1')->name('selfbots.store');
    Route::put('/selfbots/{selfbot}', [SelfDjBotController::class, 'update'])->whereNumber('selfbot')->name('selfbots.update');
    Route::patch('/selfbots/{selfbot}/enabled', [SelfDjBotController::class, 'toggle'])->whereNumber('selfbot')->name('selfbots.toggle');
    Route::delete('/selfbots/{selfbot}', [SelfDjBotController::class, 'destroy'])->whereNumber('selfbot')->name('selfbots.destroy');
    // JSON used by the playlist manager (on the Playlists page and inside rooms)
    Route::prefix('api/playlists')->name('api.playlists.')->group(function () {
        Route::get('/', [PlaylistController::class, 'list'])->name('list');
        Route::post('/', [PlaylistController::class, 'store'])->name('store');
        Route::get('/deck', [PlaylistController::class, 'deck'])->name('deck');
        Route::get('/{playlist}', [PlaylistController::class, 'show'])->name('show');
        Route::post('/{playlist}/availability', [PlaylistController::class, 'checkAvailability'])->middleware('throttle:10,1')->name('availability');
        Route::patch('/{playlist}', [PlaylistController::class, 'update'])->name('update');
        Route::delete('/{playlist}', [PlaylistController::class, 'destroy'])->name('destroy');
        Route::post('/{playlist}/activate', [PlaylistController::class, 'activate'])->name('activate');
        Route::put('/{playlist}/order', [PlaylistController::class, 'order'])->middleware('throttle:60,1')->name('order');
        Route::post('/{playlist}/shuffle', [PlaylistController::class, 'shuffle'])->middleware('throttle:30,1')->name('shuffle');
        Route::post('/{playlist}/songs', [PlaylistController::class, 'addSong'])->middleware('throttle:60,1')->name('songs.add');
        Route::post('/{playlist}/import', [PlaylistController::class, 'import'])->middleware('throttle:6,1')->name('import');
        Route::delete('/{playlist}/songs/{song}', [PlaylistController::class, 'removeSong'])->name('songs.remove');
    });
    foreach (['twitch', 'tiktok'] as $provider) {
        Route::get("/auth/{$provider}", [StreamConnectionController::class, 'connect'])->defaults('provider', $provider)->middleware('throttle:10,1')->name("{$provider}.connect");
        Route::get("/auth/{$provider}/callback", [StreamConnectionController::class, 'callback'])->defaults('provider', $provider)->middleware('throttle:10,1')->name("{$provider}.callback");
        Route::delete("/auth/{$provider}", [StreamConnectionController::class, 'disconnect'])->defaults('provider', $provider)->middleware('throttle:10,1')->name("{$provider}.disconnect");
    }
    Route::get('/auth/discord', [DiscordController::class, 'connect'])->name('discord.connect');
    Route::get('/auth/discord/callback', [DiscordController::class, 'callback'])->name('discord.callback');
    Route::delete('/auth/discord', [DiscordController::class, 'disconnect'])->name('discord.disconnect');
    Route::get('/auth/spotify', [SpotifyController::class, 'connect'])->name('spotify.connect');
    Route::get('/auth/spotify/callback', [SpotifyController::class, 'callback'])->name('spotify.callback');
    Route::delete('/auth/spotify', [SpotifyController::class, 'disconnect'])->name('spotify.disconnect');
    Route::get('/auth/youtube', [YouTubeController::class, 'connect'])->name('youtube.connect');
    Route::get('/auth/youtube/callback', [YouTubeController::class, 'callback'])->name('youtube.callback');
    Route::delete('/auth/youtube', [YouTubeController::class, 'disconnect'])->name('youtube.disconnect');

    Route::get('/whispers', [WhisperController::class, 'index'])->name('whispers');
    Route::get('/api/whisper-calls/config', [WhisperCallController::class, 'configuration'])->middleware('throttle:30,1,call-config')->name('calls.config');
    Route::get('/api/whisper-calls', [WhisperCallController::class, 'index'])->middleware('throttle:90,1,call-poll')->name('calls.index');
    Route::post('/api/whisper-calls', [WhisperCallController::class, 'store'])->middleware('throttle:5,1,call-start')->name('calls.store');
    Route::patch('/api/whisper-calls/{call}', [WhisperCallController::class, 'update'])->middleware('throttle:90,1,call-signal')->name('calls.update');
    Route::get('/api/whispers', [WhisperController::class, 'conversations'])->name('api.whispers');
    Route::get('/api/user-restrictions', [UserRestrictionController::class, 'index'])->name('api.user-restrictions.index');
    Route::put('/api/users/{user}/restrictions', [UserRestrictionController::class, 'update'])->whereNumber('user')->middleware('throttle:60,1')->name('api.user-restrictions.update');
    Route::get('/api/whispers/{user}', [WhisperController::class, 'thread'])->name('api.whispers.thread');
    Route::post('/api/whispers/{user}/read', [WhisperController::class, 'read'])->name('api.whispers.read');
    Route::post('/api/whispers', [WhisperController::class, 'send'])->middleware('throttle:30,1')->name('api.whispers.send');
    Route::post('/api/whispers/voice', [WhisperController::class, 'voice'])->middleware('throttle:10,1')->name('api.whispers.voice');
    Route::get('/api/whispers/{whisper}/audio', [WhisperController::class, 'audio'])->name('api.whispers.audio');
    Route::delete('/api/whispers/messages/{whisper}', [WhisperController::class, 'destroy'])->whereNumber('whisper')->name('api.whispers.destroy');
    Route::delete('/api/whispers/messages/{whisper}/hide', [WhisperController::class, 'hide'])->whereNumber('whisper')->middleware('throttle:60,1')->name('api.whispers.hide');
    Route::delete('/api/whispers/{user}', [WhisperController::class, 'clearConversation'])->whereNumber('user')->middleware('throttle:20,1')->name('api.whispers.clear');

    // whisper groups: messages are sent through api.whispers.send / api.whispers.voice with a group_id
    Route::prefix('api/whisper-groups')->name('api.whisper-groups.')->group(function () {
        Route::get('/', [WhisperGroupController::class, 'index'])->name('index');
        Route::post('/', [WhisperGroupController::class, 'store'])->middleware('throttle:10,1')->name('store');
        Route::get('/friends', [WhisperGroupController::class, 'friends'])->name('friends');
        Route::get('/{group}', [WhisperGroupController::class, 'show'])->whereNumber('group')->name('show');
        Route::patch('/{group}', [WhisperGroupController::class, 'update'])->whereNumber('group')->name('update');
        Route::delete('/{group}', [WhisperGroupController::class, 'destroy'])->whereNumber('group')->name('destroy');
        Route::post('/{group}/read', [WhisperGroupController::class, 'read'])->whereNumber('group')->name('read');
        Route::post('/{group}/members', [WhisperGroupController::class, 'add'])->whereNumber('group')->middleware('throttle:30,1')->name('members.add');
        Route::delete('/{group}/members/{user}', [WhisperGroupController::class, 'remove'])->whereNumber(['group', 'user'])->name('members.remove');
    });

    Route::get('/my-stuff', [MyStuffController::class, 'index'])->name('my-stuff');
    Route::post('/events', [EventController::class, 'store'])->name('events.store');
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');
    Route::post('/events/{event}/attend', [EventController::class, 'attend'])->name('events.attend');
    Route::get('/referral', [CommunityController::class, 'referral'])->name('referral');
    Route::post('/referral/claim', [CommunityController::class, 'claimReferral'])->middleware('throttle:10,1,referral-claim')->name('referral.claim');
    Route::get('/shop', [AvatarController::class, 'show'])->name('shop');
    Route::post('/shop/equip', [AvatarController::class, 'equip'])->name('shop.equip');
    Route::post('/shop/cosmetic', [AvatarController::class, 'cosmetic'])->name('shop.cosmetic');
    Route::post('/shop/outfit', [AvatarController::class, 'outfit'])->name('shop.outfit');
    Route::post('/shop/buy', [AvatarController::class, 'buy'])->middleware('throttle:30,1')->name('shop.buy');
    Route::post('/shop/daily', [AvatarController::class, 'daily'])->middleware('throttle:30,1')->name('shop.daily');

    Route::get('/friends', [FriendController::class, 'index'])->name('friends');
    Route::post('/friends', [FriendController::class, 'store'])->name('friends.store');
    Route::patch('/friends/{friendship}', [FriendController::class, 'accept'])->name('friends.accept');
    Route::delete('/friends/{friendship}', [FriendController::class, 'destroy'])->name('friends.destroy');

    Route::get('/admin/support/tickets', [SupportController::class, 'inbox'])->name('admin.support.inbox');
    Route::get('/admin/support/tickets/{ticket}', [SupportController::class, 'conversation'])->name('admin.support.show');
    Route::post('/admin/support/tickets/{ticket}/reply', [SupportController::class, 'reply'])->middleware('throttle:60,1')->name('admin.support.reply');
    Route::patch('/admin/support/tickets/{ticket}', [SupportController::class, 'status'])->name('admin.support.status');
    Route::get('/admin', [AdminController::class, 'index'])->name('admin');
    Route::patch('/admin/users/{user}/roles', [AdminController::class, 'updateRoles'])->name('admin.roles');
    Route::patch('/admin/users/{user}/awards', [AdminController::class, 'updateAwards'])->name('admin.awards');
    Route::patch('/admin/users/{user}/plan', [AdminController::class, 'updatePlan'])->name('admin.plan');
    Route::patch('/admin/users/{user}/email', [AdminController::class, 'confirmEmail'])->name('admin.users.confirm-email');
    Route::patch('/admin/users/{user}/account', [AdminController::class, 'updateAccount'])->name('admin.users.account');
    Route::put('/admin/email', [AdminController::class, 'emailSettings'])->name('admin.email');
    Route::post('/admin/email/test', [AdminController::class, 'testMail'])->middleware('throttle:10,1')->name('admin.email.test');
    Route::post('/admin/users/{user}/violations', [AdminController::class, 'warn'])->name('admin.warn');
    Route::delete('/admin/users/{user}', [AdminController::class, 'destroyUser'])->name('admin.users.destroy');
    Route::patch('/admin/rooms/{room}', [AdminController::class, 'updateRoom'])->name('admin.rooms.update');
    Route::put('/admin/room-releases/{feature}', [AdminController::class, 'updateRoomRelease'])->name('admin.room-releases.update');
    Route::delete('/admin/rooms/{room}', [AdminController::class, 'destroyRoom'])->name('admin.rooms.destroy');
    Route::put('/admin/permissions', [AdminController::class, 'updatePermissions'])->name('admin.permissions');
    Route::post('/admin/broadcast', [AdminController::class, 'broadcast'])->name('admin.broadcast');
    Route::post('/admin/ip-bans', [AdminController::class, 'banIp'])->name('admin.ipbans.store');
    Route::delete('/admin/ip-bans/{ipBan}', [AdminController::class, 'unbanIp'])->name('admin.ipbans.destroy');
    Route::put('/admin/permissions/reset', [AdminController::class, 'resetPermissions'])->name('admin.permissions.reset');
    Route::put('/community', [CommunityController::class, 'update'])->name('community.update');
    Route::post('/donations', [DonationController::class, 'store'])->middleware('throttle:10,1')->name('donations.store');
    Route::put('/admin/maintenance', [AdminController::class, 'maintenance'])->name('admin.maintenance');

    Route::get('/youtube/search', [RoomController::class, 'search'])->middleware('throttle:30,1')->name('youtube.search');

    Route::post('/rooms', [RoomController::class, 'store'])->name('rooms.store');
    Route::patch('/rooms/{room}', [RoomController::class, 'update'])->name('rooms.update');
    Route::delete('/rooms/{room}', [RoomController::class, 'destroy'])->name('rooms.destroy');
    Route::put('/rooms/{room}/rules', [RoomController::class, 'rules'])->name('rooms.rules');
    Route::put('/rooms/{room}/css', [RoomController::class, 'css'])->middleware('throttle:20,1')->name('rooms.css');
    Route::get('/gifs', [RoomController::class, 'gifs'])->middleware('throttle:30,1')->name('gifs');
    Route::post('/rooms/{room}/messages', [RoomController::class, 'message'])->middleware('throttle:60,1')->name('rooms.message');
    Route::post('/rooms/{room}/chat-image', [RoomController::class, 'image'])->middleware('throttle:10,1')->name('rooms.image');
    Route::delete('/rooms/{room}/messages', [RoomController::class, 'clearChat'])->name('rooms.clear');
    Route::post('/rooms/{room}/background', [RoomController::class, 'uploadBackground'])->middleware('throttle:10,1')->name('rooms.background.upload');
    Route::delete('/rooms/{room}/background', [RoomController::class, 'removeBackground'])->name('rooms.background.remove');
    Route::delete('/rooms/{room}/messages/{message}', [RoomController::class, 'deleteMessage'])->name('rooms.messages.delete');
    Route::post('/rooms/{room}/messages/{message}/reaction', [RoomController::class, 'react'])->middleware('throttle:30,1,chat-reactions')->name('rooms.messages.react');
    Route::post('/rooms/{room}/emojis', [RoomEmojiController::class, 'store'])->name('rooms.emojis.store');
    Route::delete('/rooms/{room}/emojis/{emoji}', [RoomEmojiController::class, 'destroy'])->name('rooms.emojis.destroy');
    Route::post('/rooms/{room}/queue-playlist', [RoomController::class, 'queuePlaylist'])->name('rooms.queue.playlist');
    Route::post('/rooms/{room}/announce', [RoomController::class, 'announce'])->name('rooms.announce');
    Route::post('/rooms/{room}/queue', [RoomController::class, 'enqueue'])->name('rooms.enqueue');
    Route::post('/rooms/{room}/join', [RoomController::class, 'join'])->middleware('throttle:30,1')->name('rooms.join');
    Route::delete('/rooms/{room}/queue/{item}', [RoomController::class, 'removeItem'])->name('rooms.remove');
    Route::delete('/rooms/{room}/waitlist', [RoomController::class, 'leaveWaitlist'])->name('rooms.leave');
    Route::post('/rooms/{room}/duration', [RoomController::class, 'updateDuration'])->name('rooms.duration');
    Route::post('/rooms/{room}/skip', [RoomController::class, 'skip'])->name('rooms.skip');
    Route::post('/rooms/{room}/live', [RoomController::class, 'goLive'])->middleware('throttle:10,1')->name('rooms.live.start');
    Route::delete('/rooms/{room}/live', [RoomController::class, 'endLive'])->name('rooms.live.end');
    Route::post('/rooms/{room}/vote', [RoomController::class, 'vote'])->name('rooms.vote');
    Route::post('/rooms/{room}/kick/{user}', [RoomController::class, 'kick'])->name('rooms.kick');
    Route::post('/rooms/{room}/ban/{user}', [RoomController::class, 'ban'])->name('rooms.ban');
    Route::delete('/rooms/{room}/ban/{user}', [RoomController::class, 'unban'])->name('rooms.unban');
    Route::post('/rooms/{room}/mute/{user}', [RoomModerationController::class, 'mute'])->name('rooms.mute');
    Route::delete('/rooms/{room}/mute/{user}', [RoomModerationController::class, 'unmute'])->name('rooms.unmute');
    Route::put('/rooms/{room}/automod', [RoomModerationController::class, 'automod'])->name('rooms.automod');
    Route::delete('/rooms/{room}/logs/{log}', [RoomModerationController::class, 'destroyLog'])->name('rooms.logs.destroy');
    Route::delete('/rooms/{room}/logs', [RoomModerationController::class, 'clearLogs'])->name('rooms.logs.clear');
    Route::patch('/rooms/{room}/waitlist-settings', [RoomController::class, 'waitlistSettings'])->name('rooms.waitlist.settings');
    Route::post('/rooms/{room}/waitlist/sweep', [RoomController::class, 'sweep'])->middleware('throttle:30,1')->name('rooms.waitlist.sweep');
    Route::get('/rooms/{room}/auto-host', [AutoHostController::class, 'show'])->name('rooms.auto-host');
    Route::put('/rooms/{room}/auto-host', [AutoHostController::class, 'update'])->name('rooms.auto-host.update');
    Route::get('/rooms/{room}/find-users', [RoomRoleController::class, 'search'])->name('rooms.find-users');
    Route::get('/emotes', [EmoteController::class, 'index'])->name('emotes');
    Route::get('/emotes/search', [EmoteController::class, 'search'])->middleware('throttle:30,1')->name('emotes.search');
    Route::post('/rooms/{room}/roles', [RoomRoleController::class, 'store'])->name('rooms.roles.store');
    Route::patch('/rooms/{room}/roles/{role}', [RoomRoleController::class, 'update'])->name('rooms.roles.update');
    Route::delete('/rooms/{room}/roles/{role}', [RoomRoleController::class, 'destroy'])->name('rooms.roles.destroy');
    Route::put('/rooms/{room}/members/{user}', [RoomRoleController::class, 'assign'])->name('rooms.members.assign');

    Route::get('/settings/account', [SettingsController::class, 'account'])->name('settings.account');
    Route::get('/settings/connections', [SettingsController::class, 'connections'])->name('settings.connections');
    Route::get('/settings/appearance', fn () => Inertia::render('Settings/Appearance'))->name('settings.appearance');
    Route::get('/settings/plus', [SubscriptionController::class, 'show'])->name('settings.plus');
    Route::get('/settings/plus/gifts/recipients', [SubscriptionGiftController::class, 'recipients'])->middleware('throttle:30,1,gifts-recipients')->name('settings.plus.gifts.recipients');
    Route::post('/settings/plus/gifts', [SubscriptionGiftController::class, 'checkout'])->middleware('throttle:5,1,gifts-checkout')->name('settings.plus.gifts.checkout');
    Route::post('/settings/plus/gifts/{gift}/activate', [SubscriptionGiftController::class, 'activate'])->whereNumber('gift')->middleware('throttle:10,1,gifts-activate')->name('settings.plus.gifts.activate');
    Route::post('/settings/plus/checkout', [SubscriptionController::class, 'checkout'])->middleware('throttle:10,1')->name('settings.plus.checkout');
    Route::post('/settings/plus/portal', [SubscriptionController::class, 'portal'])->middleware('throttle:10,1')->name('settings.plus.portal');
    Route::get('/settings/audio', fn () => Inertia::render('Settings/Audio'))->name('settings.audio');
    Route::get('/settings/system', fn () => Inertia::render('Settings/System'))->name('settings.system');
    Route::get('/settings/language-time', fn () => Inertia::render('Settings/LanguageTime'))->name('settings.language-time');
    Route::get('/settings/notifications', fn () => Inertia::render('Settings/Notifications'))->name('settings.notifications');
    Route::get('/settings/developers', [DeveloperController::class, 'index'])->name('settings.developers');
    Route::post('/settings/developers/bots', [DeveloperController::class, 'storeBot'])->middleware('throttle:10,1')->name('developers.bots.store');
    Route::delete('/settings/developers/bots/{bot}', [DeveloperController::class, 'destroyBot'])->name('developers.bots.destroy');
    Route::post('/settings/developers/tokens', [DeveloperController::class, 'storeToken'])->middleware('throttle:10,1')->name('developers.tokens.store');
    Route::delete('/settings/developers/tokens/{token}', [DeveloperController::class, 'destroyToken'])->name('developers.tokens.destroy');
    Route::delete('/settings/sessions', [SettingsController::class, 'revokeOtherSessions'])->name('settings.sessions.revoke-others');
    Route::delete('/settings/sessions/{id}', [SettingsController::class, 'revokeSession'])->name('settings.sessions.revoke');
    Route::get('/settings/export', [SettingsController::class, 'export'])->middleware('throttle:5,60')->name('settings.export');
    Route::get('/settings/privacy', fn () => Inertia::render('Settings/Privacy'))->name('settings.privacy');
    Route::get('/settings/violations', [SettingsController::class, 'violations'])->name('settings.violations');
    Route::patch('/settings/preferences', [SettingsController::class, 'updatePreferences'])->name('settings.preferences');
    Route::patch('/settings/subscription-perks', [\App\Http\Controllers\SubscriptionPerksController::class, 'update'])->name('settings.subscription-perks');
    Route::post('/settings/subscription-background', [\App\Http\Controllers\SubscriptionPerksController::class, 'background'])->name('settings.subscription-background');
    Route::delete('/settings/subscription-background', [\App\Http\Controllers\SubscriptionPerksController::class, 'removeBackground'])->name('settings.subscription-background.remove');

    Route::post('/two-factor', [TwoFactorController::class, 'enable'])->middleware('throttle:6,1,two-factor-enable')->name('two-factor.enable');
    Route::post('/two-factor/confirm', [TwoFactorController::class, 'confirm'])->middleware('throttle:6,1,two-factor-confirm')->name('two-factor.confirm');
    Route::delete('/two-factor', [TwoFactorController::class, 'destroy'])->middleware('throttle:6,1,two-factor-destroy')->name('two-factor.destroy');
});

require __DIR__.'/auth.php';
