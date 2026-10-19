import { browserChannel } from './browserChannel';
import { invalidateProfile } from './profileCache';

let channel: ReturnType<typeof browserChannel<{ userId: number }>> | null = null;

/** Invalidate server data, never accept profile fields from another window. */
export function listenForAppearanceChanges(receive: (userId: number) => void) {
    channel?.close();
    channel = browserChannel('appearance-changed', (data: { userId: number }) => {
        if (Number.isSafeInteger(data?.userId) && data.userId > 0) { invalidateProfile(data.userId); receive(data.userId); }
    });
    return () => { channel?.close(); channel = null; };
}

export function appearanceSaved(userId: number) {
    if (Number.isSafeInteger(userId) && userId > 0) { invalidateProfile(userId); channel?.postMessage({ userId }); }
}
