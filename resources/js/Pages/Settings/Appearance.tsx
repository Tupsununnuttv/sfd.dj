import Avatar from '@/Components/Avatar';
import Badges from '@/Components/Badges';
import Toggle from '@/Components/Toggle';
import { Card, Segmented, SettingsSection } from '@/Components/ui';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { savePrefs, withDefaults } from '@/lib/prefs';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const text = { small: 'text-xs', normal: 'text-sm', large: 'text-base' };

export default function Appearance() {
    const { user } = usePage<PageProps>().props.auth;
    const { appearance } = withDefaults(user.preferences);

    // the same lines as in a room, in your size, with or without pictures and badges
    const lines: [string, string, string, number, string][] = [
        [user.name, user.primary_role.color, 'Hey! This is how the chat looks for you.', user.level, 'me'],
        ['DJ Kate', '#a3a3a3', 'Great pick 🔥', 7, 'other'],
        ['Mike', '#a3a3a3', 'Woot!', 3, 'other'],
    ];

    return (
        <SettingsLayout title="Appearance" subtitle="Make the chat comfortable to read. The preview changes right away.">
            <Head title="Appearance" />

            <SettingsSection title="Preview">
                <Card className="bg-black/30 p-4">
                    <div className={`space-y-3 ${text[appearance.chat_size]}`}>
                        {lines.map(([name, color, msg, level, who]) => (
                            <div key={name + msg} className="flex gap-2.5">
                                {appearance.show_avatars && <Avatar name={name} avatar={who === 'me' ? user.avatar : null} cosmetics={who === 'me' ? user.cosmetics : null} />}
                                <div className="min-w-0">
                                    <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold" style={{ color }}>
                                        {appearance.show_badges && <Badges badges={who === 'me' ? user.badges : []} level={level} />} {name}
                                    </p>
                                    <p className="text-neutral-200">{msg}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </SettingsSection>

            <SettingsSection title="Chat text size">
                <Segmented
                    value={appearance.chat_size}
                    onChange={(v) => savePrefs({ appearance: { chat_size: v } })}
                    options={[{ value: 'small', label: 'Small', hint: 'More lines on screen' }, { value: 'normal', label: 'Normal' }, { value: 'large', label: 'Large', hint: 'Easier to read' }]}
                />
            </SettingsSection>

            <Card className="divide-y divide-white/5 px-6">
                <Toggle label="Show avatars in chat" hint="Turn off for a denser chat." checked={appearance.show_avatars} onChange={(v) => savePrefs({ appearance: { show_avatars: v } })} />
                <Toggle label="Show badges and levels in chat" hint="The little role icons and Lv numbers in front of names." checked={appearance.show_badges} onChange={(v) => savePrefs({ appearance: { show_badges: v } })} />
                <Toggle label="Show who joins, leaves and votes in chat" hint="The lines like “Kati wooted this song” and “Mike left the room”. Turn off in a very busy room." checked={appearance.show_activity} onChange={(v) => savePrefs({ appearance: { show_activity: v } })} />
                <Toggle label="Always play animations" hint="The dancing, the animated avatars and the room lights keep moving even if your computer is set to reduce motion. On Windows that is Settings, Accessibility, Visual effects, Animation effects." checked={appearance.always_animate} onChange={(v) => savePrefs({ appearance: { always_animate: v } })} />
            </Card>
        </SettingsLayout>
    );
}
