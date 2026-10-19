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

## Compact room layout

Settings → Appearance → Compact room layout saves `room.compact_layout` for the signed-in member. It makes room navigation/player bars, chat, member/waitlist spacing and the desktop side panel more compact. It is independent of the overall Compact preference, affects only that member's room view and does not resize/reposition the uploaded image or its scene canvas.

Compact, Compact chat and Compact room layout now apply optimistically before the server responds. Same-origin settings overlays and open tabs synchronize these choices using BroadcastChannel. The parent room owns saves requested from its settings overlay, so closing the overlay does not discard its write queue. Writes are serialized and preferences are merged under a database row lock. A failed write restores the last confirmed value and displays a notice; an old response cannot replace a newer visible choice.
