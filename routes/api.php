<?php

use App\Http\Controllers\ApiController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\RoomModerationController;
use App\Http\Controllers\RoomRoleController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\WhisperController;
use App\Http\Middleware\BlockBannedIps;
use App\Http\Middleware\EnsureRoomAccess;
use App\Http\Middleware\MaintenanceMode;
use Illuminate\Support\Facades\Route;

/*
 * SFD.DJ public API, version 1. Authenticate with `Authorization: Bearer <token>`; make tokens (for yourself or for a bot)
 * under Settings → Developers. Everything goes through the same permission checks as the website, so a bot can only do
 * what its room role allows. Room parameters are the room's slug.
 */
Route::prefix('v1')->name('api.v1.')->middleware([BlockBannedIps::class, 'auth:sanctum', MaintenanceMode::class, 'throttle:120,1', EnsureRoomAccess::class])->group(function () {
    Route::get('/me', [ApiController::class, 'me'])->name('me');
    Route::get('/users/{user}', [UserProfileController::class, 'card'])->name('users.show');

    Route::get('/rooms', [ApiController::class, 'rooms'])->name('rooms');
    Route::get('/rooms/{room}', [ApiController::class, 'room'])->name('room');
    Route::get('/rooms/{room}/messages', [ApiController::class, 'messages'])->name('messages');
    Route::get('/rooms/{room}/members', [ApiController::class, 'members'])->name('members');

    Route::post('/rooms/{room}/messages', [RoomController::class, 'message'])->middleware('throttle:60,1')->name('messages.send');
    Route::delete('/rooms/{room}/messages', [RoomController::class, 'clearChat'])->name('messages.clear');
    Route::delete('/rooms/{room}/messages/{message}', [RoomController::class, 'deleteMessage'])->name('messages.delete');
    Route::post('/rooms/{room}/announce', [RoomController::class, 'announce'])->name('announce');

    Route::post('/rooms/{room}/queue', [RoomController::class, 'enqueue'])->name('queue.add');
    Route::delete('/rooms/{room}/queue/{item}', [RoomController::class, 'removeItem'])->name('queue.remove');
    Route::delete('/rooms/{room}/waitlist', [RoomController::class, 'leaveWaitlist'])->name('waitlist.leave');
    Route::patch('/rooms/{room}/waitlist-settings', [RoomController::class, 'waitlistSettings'])->name('waitlist.settings');
    Route::post('/rooms/{room}/skip', [RoomController::class, 'skip'])->name('skip');
    Route::post('/rooms/{room}/vote', [RoomController::class, 'vote'])->name('vote');
    Route::get('/youtube/search', [RoomController::class, 'search'])->middleware('throttle:30,1')->name('youtube.search');

    Route::post('/rooms/{room}/kick/{user}', [RoomController::class, 'kick'])->name('kick');
    Route::post('/rooms/{room}/ban/{user}', [RoomController::class, 'ban'])->name('ban');
    Route::delete('/rooms/{room}/ban/{user}', [RoomController::class, 'unban'])->name('unban');
    Route::post('/rooms/{room}/mute/{user}', [RoomModerationController::class, 'mute'])->name('mute');
    Route::delete('/rooms/{room}/mute/{user}', [RoomModerationController::class, 'unmute'])->name('unmute');
    Route::put('/rooms/{room}/members/{user}', [RoomRoleController::class, 'assign'])->name('members.assign');

    Route::get('/whispers', [WhisperController::class, 'conversations'])->name('whispers');
    Route::get('/whispers/{user}', [WhisperController::class, 'thread'])->name('whispers.thread');
    Route::post('/whispers', [WhisperController::class, 'send'])->middleware('throttle:30,1')->name('whispers.send');
});
