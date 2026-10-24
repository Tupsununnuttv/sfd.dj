import { SettingsSection } from '@/Components/ui';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { withDefaults } from '@/lib/prefs';
import { Language, previewRegional, translate } from '@/lib/regional';
import { send } from '@/lib/post';
import { languages } from '@/lib/languages';
import { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function LanguageTime() {
    const { regional } = withDefaults(usePage<PageProps>().props.auth.user.preferences);
    const form = useForm({ regional });
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState('');
    const t = (text: string) => translate(text, form.data.regional.language);
    const select = 'mt-2 block w-full max-w-sm rounded-lg border border-white/10 bg-neutral-900 px-3 py-2.5 text-sm text-white focus:border-violet-400 focus:ring-violet-400';
    const change = (patch: Partial<typeof regional>) => {
        const previous = form.data.regional;
        const next = { ...previous, ...patch };
        form.setData('regional', next);
        previewRegional(next);
        setSaving(true); setNotice('');
        if (window.parent !== window) window.parent.postMessage({ type: 'sfd:regional-preview', regional: next }, window.location.origin);
        void send('PATCH', route('settings.preferences'), { regional: next }, { keepalive: true }).then(() => {
            setNotice('Changes saved.');
            router.reload({ only: ['auth'] });
            if (window.parent !== window) window.parent.postMessage({ type: 'sfd:preferences-updated' }, window.location.origin);
        }).catch(() => {
                previewRegional(previous); form.setData('regional', previous); setNotice('Could not save your changes. Please try again.');
                if (window.parent !== window) window.parent.postMessage({ type: 'sfd:regional-preview', regional: previous }, window.location.origin);
        }).finally(() => setSaving(false));
    };
    const preview = new Intl.DateTimeFormat(languages[form.data.regional.language].locale, { hour: '2-digit', minute: '2-digit', hour12: form.data.regional.time_format === '12' }).format(new Date(2026, 0, 1, 13, 0));

    return <SettingsLayout title={t('Language & Time')} subtitle={t('Choose your language and how times are displayed.')}>
        <Head title={t('Language & Time')} />
        <div className="space-y-6">
            <SettingsSection title={t('Language & Time')} text={t('Saved to your account and used on your other devices.')}>
                <label htmlFor="language" className="block text-sm font-semibold">{t('Language')}</label>
                <select id="language" className={select} value={form.data.regional.language} disabled={saving} onChange={(e) => change({ language: e.target.value as Language })}>
                    {Object.entries(languages).map(([code, language]) => <option key={code} value={code} lang={code}>{language.label}</option>)}
                </select>
                <p className="mt-2 text-xs leading-relaxed text-neutral-400">{t('Your language changes everywhere as soon as you select it. Changes are saved automatically.')}</p>
                <label htmlFor="time-format" className="mt-6 block text-sm font-semibold">{t('Time Format')}</label>
                <select id="time-format" className={select} value={form.data.regional.time_format} disabled={saving} onChange={(e) => change({ time_format: e.target.value as '12' | '24' })}>
                    <option value="24">{t('24-hour (13:00)')}</option><option value="12">{t('12-hour (1:00 PM)')}</option>
                </select>
                <p className="mt-3 text-sm text-neutral-400">{t('Preview')}: <span className="font-semibold tabular-nums text-white">{preview}</span></p>
            </SettingsSection>
            {Object.values(form.errors).map((error, index) => <p key={index} role="alert" className="text-sm text-red-300">{error}</p>)}
            <p role="status" className="text-sm text-emerald-300">{saving ? t('Saving…') : t(notice)}</p>
        </div>
    </SettingsLayout>;
}
