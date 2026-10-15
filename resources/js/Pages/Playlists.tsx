import PlaylistManager from '@/Components/PlaylistManager';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function Playlists() {
    return (
        <AppLayout title="Playlists" subtitle="Build your playlists from YouTube, SoundCloud and Spotify and drag the tracks into the order they should play in. Your active playlist is the one you play from: open a room and press Join Waitlist.">
            <Head title="Playlists" />
            <PlaylistManager className="h-[calc(100dvh-15rem)] min-h-136 rounded-3xl border border-white/10" />
        </AppLayout>
    );
}
