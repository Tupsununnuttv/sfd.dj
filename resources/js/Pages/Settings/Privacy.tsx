import Toggle from '@/Components/Toggle';
import { Card, Segmented, SettingsSection } from '@/Components/ui';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { savePrefs, withDefaults } from '@/lib/prefs';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Check, X } from 'lucide-react';

const visible = ['Your display name, username and picture', 'Your level, role badges and shop items', 'Your bio and favourite genre', 'When you joined, your song, woot and friend counts', 'Your public rooms', 'Your Discord name, if you linked it', 'Your YouTube channel, if you connected it', 'Your chat messages, to everyone in the room'];
const hidden = ['Your email address', 'Your password (nobody can see it, not even staff)', 'Your encrypted Spotify and YouTube OAuth tokens', 'Your whispers: only you and the other person', 'Your private rooms', 'The devices you are logged in on'];

export default function Privacy() {
    const { privacy } = withDefaults(usePage<PageProps>().props.auth.user.preferences);

    return (
        <SettingsLayout title="Privacy" subtitle="You decide who can reach you and what other people see about you.">
            <Head title="Privacy" />

            <SettingsSection title="Who can whisper to you" text="Whispers are private messages. SFD-DJ.EU staff can always reach you, so you can still get help.">
                <Segmented
                    value={privacy.whispers}
                    onChange={(v) => savePrefs({ privacy: { whispers: v } })}
                    options={[
                        { value: 'everyone', label: 'Everyone', hint: 'Anyone with an account' },
                        { value: 'friends', label: 'Friends only', hint: 'People you accepted' },
                        { value: 'nobody', label: 'Nobody', hint: 'Whispers switched off' },
                    ]}
                />
            </SettingsSection>

            <Card className="divide-y divide-white/5 px-6">
                <Toggle
                    label="Let people send me friend requests"
                    hint="Turn it off to stop new requests. Requests you already have, and answers to ones you sent, still work."
                    checked={privacy.friend_requests}
                    onChange={(v) => savePrefs({ privacy: { friend_requests: v } })}
                />
                <Toggle
                    label="Show when I am online and which room I am in"
                    hint="Your friends see a green dot and a Join button. Off means you always look offline to them."
                    checked={privacy.show_online}
                    onChange={(v) => savePrefs({ privacy: { show_online: v } })}
                />
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="p-6">
                    <h3 className="font-bold">What other people can see</h3>
                    <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                        {visible.map((t) => <li key={t} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-green-400" /> {t}</li>)}
                    </ul>
                </Card>
                <Card className="p-6">
                    <h3 className="font-bold">What stays private</h3>
                    <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                        {hidden.map((t) => <li key={t} className="flex items-start gap-2"><X size={16} className="mt-0.5 shrink-0 text-red-400" /> {t}</li>)}
                    </ul>
                </Card>
            </div>

            <p className="text-sm text-neutral-500">
                More: <Link href={route('settings.account')} className="text-violet-400 hover:underline">download or delete your data</Link>, or read the <Link href={route('site.legal', 'privacy')} className="text-violet-400 hover:underline">privacy policy</Link>.
            </p>
        </SettingsLayout>
    );
}
