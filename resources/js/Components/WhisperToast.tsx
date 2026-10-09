import { PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { withDefaults } from '@/lib/prefs';
import { useEffect, useRef, useState } from 'react';

interface Incoming {
    from_id: number;
    body: string;
    sender: { id: number; name: string };
}

/** A small popup when someone whispers to you (not when you are already reading whispers). */
export default function WhisperToast() {
    const { auth } = usePage<PageProps>().props;
    const [toast, setToast] = useState<Incoming | null>(null);
    const prefs = useRef(withDefaults(auth.user.preferences).notifications);
    prefs.current = withDefaults(auth.user.preferences).notifications; // the listener below always reads the latest settings
    const busy = useRef(false);
    busy.current = auth.user.status === 'busy'; // do not disturb: the whisper still arrives, only the pop-ups stay away

    useEffect(() => {
        if (auth.guest) return;
        const ch = echo<'reverb'>().private(`App.Models.User.${auth.user.id}`);
        const onWhisper = (w: Incoming) => {
            if (w.from_id === auth.user.id) return;
            router.reload({ only: ['unreadWhispers'] });

            // a notification from the browser itself, when this tab is in the background
            if (!busy.current && prefs.current.desktop && document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification(`${w.sender.name} whispered to you`, { body: w.body, tag: `whisper-${w.sender.id}` });
            }

            if (!busy.current && prefs.current.whispers && !route().current('whispers')) {
                setToast(w);
                setTimeout(() => setToast((t) => (t === w ? null : t)), 7000);
            }
        };
        ch.listen('.whisper', onWhisper);

        return () => { ch.stopListening('.whisper', onWhisper); };
    }, [auth.guest, auth.user.id]);

    if (!toast) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 w-72 rounded-xl border border-violet-500/40 bg-neutral-900 p-4 text-sm shadow-2xl">
            <p className="text-xs font-semibold text-violet-300">💬 Whisper from {toast.sender.name}</p>
            <p className="mt-1 line-clamp-3 break-words text-neutral-200">{toast.body}</p>
            <div className="mt-3 flex gap-2">
                <Link href={route('whispers', { with: toast.sender.id })} className="rounded-md bg-violet-600 px-3 py-1 text-xs font-semibold hover:bg-violet-500">Open</Link>
                <button onClick={() => setToast(null)} className="rounded-md bg-neutral-800 px-3 py-1 text-xs hover:bg-neutral-700">Dismiss</button>
            </div>
        </div>
    );
}
