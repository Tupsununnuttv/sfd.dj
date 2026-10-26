import ApplicationLogo from '@/Components/ApplicationLogo';
import RoomBadge from '@/Components/RoomBadge';
import { Equalizer } from '@/Components/ui';
import { poll } from '@/lib/polling';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';

interface ActivityRoom {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    badges: string[] | null;
    genre: string | null;
    listening: number;
    now_playing: string | null;
    live_title: string | null;
}

/** Only a room picker; room links remain inside the Activity and open anonymously. */
export default function Activity({ rooms }: { rooms: ActivityRoom[] }) {
    useEffect(() => {
        const job = poll(() => new Promise<void>(resolve => router.reload({ only: ['rooms'], onFinish: () => resolve() })), { interval: 20000, immediate: false });
        return () => job.stop();
    }, []);
    return <div className="min-h-dvh bg-neutral-950 px-4 py-6 text-white">
        <Head title="Choose a room" />
        <main className="mx-auto max-w-5xl">
            <ApplicationLogo className="text-xl" />
            <h1 className="mt-6 text-2xl font-black">Choose a room</h1>
            <p className="mt-1 text-sm text-neutral-400">Join a public room as a guest, right here in Discord.</p>
            {rooms.length === 0 ? <p className="mt-6 rounded-xl border border-white/10 p-6 text-neutral-400">No public rooms are available right now.</p> :
                <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {rooms.map(room => <li key={room.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{room.name}</h2><RoomBadge badges={room.badges} /></div>
                        <p className="mt-2 flex items-center gap-2 text-xs text-green-400">{room.listening > 0 && <Equalizer />}{room.listening} listening {room.genre && <span className="text-neutral-400">? {room.genre}</span>}</p>
                        <p className="mt-2 truncate text-sm text-neutral-300">{room.live_title || room.now_playing || room.description || 'Waiting for the next DJ?'}</p>
                        <Link href={route('rooms.show', room.slug)} className="mt-4 self-start rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500">Join as guest</Link>
                    </li>)}
                </ul>}
        </main>
    </div>;
}
