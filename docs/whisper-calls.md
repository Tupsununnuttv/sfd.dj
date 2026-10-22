# Whisper voice and video calls

One-to-one calls are available from the phone and camera buttons in a direct Whisper conversation. Incoming calls appear while the recipient has the site open, including on room pages. Group calls are not included. The recipient must explicitly accept before microphone or camera access is requested. Calls continue across Inertia navigation and stop on logout, closing the page or hanging up. No audio or video is recorded by this feature.

Run `php artisan migrate --force` and `npm run build` when deploying. Serve the site over HTTPS (localhost also works for development). The app permits camera and microphone access only to its own origin. Keep the Laravel scheduler running; its minute task expires abandoned calls and removes ended call rows after one day. Signaling descriptions are removed when calls end. Incoming calls and signaling use authenticated polling every two seconds, independent of Reverb availability.

## Network configuration

The default STUN server supports direct connections. For reliable connectivity across mobile networks, restrictive firewalls and different NATs, configure a coturn-compatible TURN relay:

```dotenv
CALL_STUN_URL=stun:stun.l.google.com:19302
CALL_TURN_URL=turn:your-relay.example.com:3478
CALL_TURN_SECRET=your-coturn-static-auth-secret
```

The secret must match the relay's shared authentication secret. Do not put it in VITE variables. Authenticated clients receive HMAC credentials valid for two hours; the shared secret stays on the server. Use a TLS TURN endpoint (`turns:`) if your relay supports it. Reload cached configuration after changing these settings.

## Manual verification

Use two accounts in separate browsers/devices over HTTPS: start voice and video calls, accept/decline, mute/unmute, toggle camera, navigate pages, hang up on either side, deny device permission, close a tab and wait for expiry. Check audio and video in both directions on different networks using the configured TURN relay. An offline recipient cannot receive a browser call; unanswered calls time out. Only one call per account is allowed. A device-to-device media test is required in addition to the automated signaling and authorization tests.

Reference: [MDN WebRTC signaling and video calling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling).


## Message and conversation removal

In a direct Whisper, the sender can delete their own text or voice message for everyone. The recipient can use **Hide message for me** to remove the received message from their own history. This preserves the sender's message and voice recording. Hidden messages do not appear in the viewer's unread count or reply previews.

Use the trash button beside a person in the conversation list, or in the open conversation header, to **Remove conversation for me**. After confirmation, existing messages in both directions are hidden only for that user. A new message brings the conversation back without restoring the hidden history. This does not delete the person's account, block messages, remove a friendship, or alter group membership. Groups retain their existing leave/delete controls.

Visibility is stored in `hidden_whispers`, scoped to the signed-in user. Private events update the user's other tabs. Apply `2026_12_03_000001_create_hidden_whispers.php` when deploying. Feature coverage: `php artisan test --filter=Whisper`.
