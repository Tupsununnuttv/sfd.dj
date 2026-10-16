import WhisperBox, { Person } from '@/Components/WhisperBox';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function Whispers({ with: start, group, friends }: { with: number | null; group: number | null; friends: Person[] }) {
    return (
        <AppLayout
            title="Whispers"
            subtitle={<>Private messages between you and one other person, or a group of your friends. In a room's chat you can also type <code className="rounded bg-white/10 px-1.5 py-0.5 text-violet-300">/w username message</code>.</>}
        >
            <Head title="Whispers" />
            <WhisperBox start={start} startGroup={group} friends={friends} />
        </AppLayout>
    );
}
