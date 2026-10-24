# Uploaded room backgrounds and deployments

New room background uploads keep one durable copy in `room_background_assets`, separate from normal room records. The table stores the image MIME type, checksum and base64 bytes, with a maximum uploaded file size of 4 MB. Other uploads are unchanged. Normal room/list payloads do not load the image data.

The existing media URL serves this copy, even after a release replaces the local filesystem or changes the uploads disk. Browser caching and ETags avoid re-downloading unchanged images. Replacing a background replaces its database copy; explicitly removing it deletes the copy too. Deleting the room cascades to its archived background.

An uploaded custom picture also stays selected across seasonal changes unless a settings manager explicitly chooses another background.

## Deployment

The production database must be persistent and included in backups. Do not replace it from a development database during normal deployments.

Run the new migration before serving the new PHP code:

```sh
php artisan migrate --force
```

For pictures uploaded before this change, run this on the environment that still has their files, after applying the migration and before discarding its filesystem:

```sh
php artisan room-backgrounds:archive
```

The command is idempotent and reports missing or unsupported files. It leaves the old files and room selection intact. Already deleted files cannot be reconstructed from their filenames: restore those from a backup or upload them once. Newly uploaded/archived pictures no longer depend on preserving that filesystem.

Deploy the new frontend build as usual. The local workspace migration and archive command were run; the workspace had no existing backgrounds to archive. This does not verify or migrate the separate production server.

## Compact layout preset

Settings → Appearance has one Compact switch. It sets `appearance.compact`, `appearance.compact_chat` and `room.compact_layout` together, with a single atomic preference write. The separate Compact chat and Compact room layout settings were removed. Turning the preset off clears all three flags. Other preferences, the uploaded image and the scene canvas are preserved.

The chat's existing Compact chat toolbar button remains independent and can override chat density after the preset is applied. Chat-specific CSS follows that button's density attribute rather than the room/global density, so the override remains visible while the room stays compact. Legacy preference fields remain accepted for older clients.

The complete preset applies optimistically as one notification before the server responds. Same-origin settings overlays and open tabs synchronize the group using BroadcastChannel, with frame/storage fallbacks. The parent room owns overlay saves, so closing the overlay does not discard its write queue. Writes are serialized under a database row lock. A failed write restores the last confirmed flags; an older response cannot replace a newer chat override. Unchanged stale auth props on background Inertia reloads do not reset locally saved density choices.
