import Toggle from '@/Components/Toggle';
import { Card, ghostBtn, SettingsSection } from '@/Components/ui';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { savePrefs, withDefaults } from '@/lib/prefs';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { SlidersHorizontal, Volume1, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';

const KEY = 'sfddj.volume';

export default function Audio() {
    const { audio } = withDefaults(usePage<PageProps>().props.auth.user.preferences);
    const [volume, setVolume] = useState<number>(audio.default_volume);
    const [here, setHere] = useState<string | null>(() => { try { return localStorage.getItem(KEY); } catch { return null; } });

    // a volume you set in a room is remembered per browser and wins over this default; saving here clears it
    const save = () => {
        savePrefs({ audio: { default_volume: volume } });
        try { localStorage.removeItem(KEY); } catch { /* private mode */ }
        setHere(null);
    };
    const Icon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

    return (
        <SettingsLayout title="Audio" subtitle="How loud the music starts, and what happens when you open a room.">
            <Head title="Audio" />

            <SettingsSection title="Default volume" text="Where the volume slider starts the first time you use a browser.">
                <div className="flex items-center gap-4">
                    <Icon size={22} className="shrink-0 text-violet-300" />
                    <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(+e.target.value)} onPointerUp={save} onKeyUp={save} className="w-full accent-violet-500" aria-label="Default volume" />
                    <span className="w-12 text-right text-lg font-bold tabular-nums">{volume}%</span>
                </div>
                {here !== null && (
                    <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                        In this browser the volume is {here}% (the last one you set in a room).
                        <button onClick={() => { try { localStorage.removeItem(KEY); } catch { /* private mode */ } setHere(null); }} className={`${ghostBtn} py-1.5 text-xs`}>Use the default again</button>
                    </p>
                )}
            </SettingsSection>

            <Card className="divide-y divide-white/5 px-6">
                <Toggle label="Join rooms muted" hint="The player starts at 0% when you enter a room." checked={audio.mute_on_join} onChange={(v) => savePrefs({ audio: { mute_on_join: v } })} />
                <Toggle label="Entrance sounds" hint="Play a sound when someone enters the room." checked={audio.entrance_sounds} onChange={(v) => savePrefs({ audio: { entrance_sounds: v } })} />
            </Card>

            <SettingsSection title={<span className="flex flex-wrap items-center gap-3"><SlidersHorizontal size={20} className="text-violet-300" /> Equalizer <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">Coming Soon</span></span>}>
                <p className="text-sm text-neutral-400">Bass, mids and treble controls will be available here in a future update.</p>
            </SettingsSection>
        </SettingsLayout>
    );
}
