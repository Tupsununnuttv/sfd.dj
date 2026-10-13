import Toggle from '@/Components/Toggle';
import { Card, SectionTitle } from '@/Components/ui';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { savePrefs, withDefaults } from '@/lib/prefs';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Notifications() {
    const { notifications } = withDefaults(usePage<PageProps>().props.auth.user.preferences);
    const supported = typeof Notification !== 'undefined';
    const [permission, setPermission] = useState<NotificationPermission>(supported ? Notification.permission : 'denied');

    // browser notifications need the browser's own yes first
    const desktop = async (on: boolean) => {
        if (on && supported && Notification.permission !== 'granted') {
            const answer = await Notification.requestPermission();
            setPermission(answer);
            if (answer !== 'granted') return;
        }
        savePrefs({ notifications: { desktop: on } });
    };

    return (
        <SettingsLayout title="Notifications" subtitle="Choose what pops up, and what only waits for you.">
            <Head title="Notifications" />

            <section>
                <SectionTitle title="In SFD-DJ.EU" />
                <Card className="divide-y divide-white/5 px-6">
                    <Toggle label="Friend requests" hint="Show the request counter next to Friends in the menu." checked={notifications.friend_requests} onChange={(v) => savePrefs({ notifications: { friend_requests: v } })} />
                    <Toggle label="Whisper pop-ups" hint="A small pop-up when someone whispers to you. The counter next to Whispers always stays." checked={notifications.whispers} onChange={(v) => savePrefs({ notifications: { whispers: v } })} />
                    <Toggle label="Highlight messages that mention me" hint="A soft yellow background on chat lines with @your name." checked={notifications.mentions} onChange={(v) => savePrefs({ notifications: { mentions: v } })} />
                    <Toggle label="Site announcements" hint="Show the banner when staff broadcast a message." checked={notifications.announcements} onChange={(v) => savePrefs({ notifications: { announcements: v } })} />
                </Card>
            </section>

            <section>
                <SectionTitle title="On your computer" hint="When SFD-DJ.EU is open in a tab you are not looking at." />
                <Card className="px-6">
                    <Toggle label="Browser notifications for whispers" hint={supported ? 'Your browser shows a notification when a whisper arrives while this tab is in the background.' : 'This browser does not support notifications.'} checked={notifications.desktop && permission === 'granted'} onChange={desktop} />
                    {permission === 'denied' && supported && <p className="pb-4 text-sm text-amber-300">Notifications are blocked for this site in your browser. Allow them in the address bar's site settings, then switch this on.</p>}
                </Card>
            </section>
        </SettingsLayout>
    );
}
