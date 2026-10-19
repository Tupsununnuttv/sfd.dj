let sequence = 0;

/** Correlation IDs, never authentication or security tokens. Also works on plain-HTTP development hosts. */
export function browserId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Non-sensitive UI events. Storage restrictions must not break the page or its same-origin overlays. */
export function browserChannel<T>(name: string, receive: (data: T) => void) {
    const key = `sfd:channel:${name}`;
    const seen = new Set<string>();
    let channel: BroadcastChannel | null = null;
    let closed = false;
    type Packet = { channel: string; id: string; data: T };
    const remember = (id: string) => {
        seen.add(id);
        if (seen.size > 100) seen.delete(seen.values().next().value!);
    };
    const forward = (packet: Packet, source: MessageEventSource | null = null) => {
        if (window.parent !== window && window.parent !== source) window.parent.postMessage(packet, window.location.origin);
        if (window.opener && window.opener !== source) window.opener.postMessage(packet, window.location.origin);
        for (let i = 0; i < window.frames.length; i++) {
            if (window.frames[i] !== source) window.frames[i].postMessage(packet, window.location.origin);
        }
    };
    const accept = (packet: Packet | undefined, source: MessageEventSource | null = null) => {
        if (closed || packet?.channel !== key || typeof packet.id !== 'string' || seen.has(packet.id)) return;
        remember(packet.id);
        forward(packet, source);
        receive(packet.data);
    };
    try {
        channel = new BroadcastChannel(key);
        channel.onmessage = ({ data }) => accept(data);
    } catch { /* unavailable or blocked by browser privacy settings */ }
    const message = (event: MessageEvent) => {
        if (event.origin === window.location.origin) accept(event.data, event.source);
    };
    const storage = (event: StorageEvent) => {
        if (event.key !== key || !event.newValue) return;
        try { accept(JSON.parse(event.newValue)); } catch { /* invalid storage event */ }
    };
    window.addEventListener('message', message);
    window.addEventListener('storage', storage);
    return {
        postMessage(data: T) {
            if (closed) return;
            const packet: Packet = { channel: key, id: browserId(), data };
            remember(packet.id);
            forward(packet);
            try { channel?.postMessage(packet); } catch { /* still deliver through storage/frames */ }
            // Also reaches a tab whose BroadcastChannel constructor was blocked.
            try { localStorage.setItem(key, JSON.stringify(packet)); localStorage.removeItem(key); } catch { /* same-origin frames still work */ }
        },
        close() {
            closed = true;
            channel?.close();
            window.removeEventListener('message', message);
            window.removeEventListener('storage', storage);
        },
    };
}
