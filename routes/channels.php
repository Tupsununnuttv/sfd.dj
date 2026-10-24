<?php

use App\Models\Room;
use Illuminate\Support\Facades\Broadcast;

// every logged-in user may join every room except the ones that banned them and private ones they may not enter
Broadcast::channel('room.{id}', function ($user, $id) {
    $room = Room::find($id);

    if (! $room || ! $room->canEnter($user) || $room->bans()->where('user_id', $user->id)->exists()) {
        return false;
    }

    return $user->presenceInfo();
});

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// the staff inbox of the live support chat
Broadcast::channel('support-staff', fn ($user) => $user->hasPermission('support.manage'));
