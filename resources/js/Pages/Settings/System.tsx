import Toggle from '@/Components/Toggle';
import { Card, SettingsSection } from '@/Components/ui';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { saveSystemPreference, useSystemPreferences } from '@/lib/systemPreferences';
import { effectiveSystem, type SystemKey } from '@/lib/systemState';
import { Head } from '@inertiajs/react';
import { Gauge, Monitor } from 'lucide-react';

const choices: { key: SystemKey; label: string; hint: string }[] = [
    { key: 'animated_characters', label: 'Animated characters', hint: 'Play dancing characters and the DJ animation. Turn off to use still pictures, including in the avatar shop.' },
    { key: 'background_effects', label: 'Background animations and particles', hint: 'Show moving scenery, snow, leaves and other decorative particles in rooms.' },
    { key: 'visual_effects', label: 'Blur, glow and shadow effects', hint: 'Turn off to reduce decorative filters, blurred layers and avatar effects across the site.' },
    { key: 'simple_background', label: 'Lightweight room background', hint: 'Use a small static room image instead of the detailed interactive scenery.' },
];

export default function System() {
    const { values, pending } = useSystemPreferences();
    const effective = effectiveSystem(values);
    const saving = Object.keys(pending).length > 0;
    return <SettingsLayout title="System" subtitle="Adjust graphics and animations for your laptop or desktop.">
        <Head title="System" />
        <SettingsSection title={<span className="flex items-center gap-2"><Gauge size={20} /> Performance</span>} text="Changes apply immediately and are saved to your account. Music, chat and room controls keep working.">
            <Toggle label="Low performance mode" hint="For older or slower computers: use still characters, a lightweight background and fewer visual effects." checked={values.low_performance} onChange={value => saveSystemPreference('low_performance', value)} />
            <p role="status" className="mt-2 text-xs text-neutral-400">{saving ? 'Saving performance settings…' : 'Performance settings are up to date.'}</p>
        </SettingsSection>
        <SettingsSection title="Graphics and animations" text={values.low_performance ? 'Low performance mode overrides these choices. Turn it off to restore your individual settings.' : 'Choose which effects this site displays. These settings take priority over Always play animations.'}>
            <fieldset disabled={values.low_performance} className="divide-y divide-white/5 disabled:opacity-60">
                {choices.map(choice => <Toggle key={choice.key} label={choice.label} hint={choice.hint} checked={effective[choice.key]} onChange={value => saveSystemPreference(choice.key, value)} />)}
            </fieldset>
        </SettingsSection>
        <Card className="space-y-3 p-6" data-hardware-help>
            <h3 className="flex items-center gap-2 font-semibold"><Monitor size={18} /> Browser hardware acceleration</h3>
            <p className="text-sm leading-relaxed text-neutral-400">Your browser controls hardware acceleration. A website cannot switch it on or off or reliably detect its current setting.</p>
            <p className="text-sm leading-relaxed text-neutral-400">It usually helps video playback by using your GPU. If you see flickering, black video or graphics crashes, try changing it in your browser and restart the browser.</p>
            <details className="text-sm text-neutral-300"><summary className="cursor-pointer font-semibold">How to change it in your browser</summary>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-400">
                    <li>Edge: Settings → System and performance → Use graphics acceleration when available.</li>
                    <li>Chrome, Brave and Opera GX: open browser Settings and search for “graphics acceleration” or “hardware acceleration”.</li>
                    <li>Firefox: Settings → Performance. Disable “Use recommended performance settings” to reveal the hardware acceleration option.</li>
                </ul>
                <p className="mt-3 text-xs text-neutral-500">The option can be unavailable on unsupported devices or managed browsers. Restarting can interrupt room playback.</p>
                <p className="mt-3 flex gap-4 text-xs text-violet-300"><a href="https://learn.microsoft.com/en-us/troubleshoot/microsoft-edge/performance/edge-high-cpu-memory" target="_blank" rel="noopener noreferrer">Microsoft guidance</a><a href="https://support.mozilla.org/en-US/kb/performance-settings" target="_blank" rel="noopener noreferrer">Firefox guidance</a></p>
            </details>
        </Card>
    </SettingsLayout>;
}
