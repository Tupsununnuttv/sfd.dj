import Avatar from '@/Components/Avatar';
import { PageProps } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { useEffect, useState } from 'react';

interface Request {
    id: number; // friendship id
    name: string;
    avatar: string | null;
}

/** Pops up when someone sends you a friend request, with Accept / Decline right there. */
export default function FriendToast() {
    const { auth } = usePage<PageProps>().props;
    const [requests, setRequests] = useState<Request[]>([]);
    const enabled = auth.user.preferences?.notifications?.friend_requests !== false && auth.user.status !== 'busy'; // busy means do not disturb

    useEffect(() => {
        if (auth.guest) return;
        const name = `App.Models.User.${auth.user.id}`;
        echo<'reverb'>()
            .private(name)
            .listen('.friend-requested', (r: Request) => {
                router.reload({ only: ['pendingFriends'] });
                if (enabled) setRequests((cur) => [...cur.filter((x) => x.id !== r.id), r]);
            });

        return () => {
            echo().leave(name);
        };
    }, [auth.user.id, auth.guest, enabled]);

    const close = (id: number) => setRequests((cur) => cur.filter((r) => r.id !== id));
    const answer = (r: Request, accept: boolean) => {
        const opts = { preserveScroll: true, preserveState: true, onFinish: () => close(r.id) };
        if (accept) router.patch(route('friends.accept', r.id), {}, opts);
        else router.delete(route('friends.destroy', r.id), opts);
    };

    if (requests.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[60] w-72 space-y-2">
            {requests.map((r) => (
                <div key={r.id} className="rounded-xl border border-neutral-700 bg-neutral-900 p-3 text-white shadow-xl">
                    <div className="flex items-center gap-3">
                        <Avatar name={r.name} avatar={r.avatar} />
                        <p className="flex-1 text-sm">
                            <span className="font-semibold">{r.name}</span> wants to be your friend
                        </p>
                        <button onClick={() => close(r.id)} aria-label="Dismiss" className="text-neutral-500 hover:text-white">✕</button>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button onClick={() => answer(r, true)} className="flex-1 rounded-md bg-violet-600 py-1.5 text-xs font-semibold hover:bg-violet-500">Accept</button>
                        <button onClick={() => answer(r, false)} className="flex-1 rounded-md bg-neutral-800 py-1.5 text-xs hover:bg-neutral-700">Decline</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
