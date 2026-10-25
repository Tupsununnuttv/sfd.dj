import '../css/app.css';
import '../css/subscription.css';
import { applyRegional, getLanguage, getRegionalSnapshot, loadRegionalLanguage, previewRegional, setRegionalAccount, subscribeLanguage, translate } from '@/lib/regional';
import { isLanguage } from '@/lib/languages';

import RoomLoading from '@/Components/RoomLoading';
import WhisperCalls from '@/Components/WhisperCalls';
import CompactPreferenceNotice from '@/Components/CompactPreferenceNotice';
import { syncCompactPreferences } from '@/lib/compactPreferences';
import { syncSystemPreferences } from '@/lib/systemPreferences';
import SystemPreferenceNotice from '@/Components/SystemPreferenceNotice';
import { listenForAppearanceChanges } from '@/lib/appearanceChanges';
import { discordActivity } from '@/lib/discordActivity';
import { embedded } from '@/lib/embed';
import { applyMotion } from '@/lib/motion';
import { PageProps } from '@/types';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ComponentType, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { configureEcho } from '@laravel/echo-react';

// live updates: Reverb on this computer, Pusher on the live site (VITE_BROADCASTER=pusher when it is built); the keys come from the VITE_REVERB_ / VITE_PUSHER_ variables
// (not inside a Discord Activity: its page is polled, and Discord's proxy only lets a socket through that has a URL mapping)
if (!discordActivity) configureEcho(import.meta.env.VITE_BROADCASTER === 'pusher' ? { broadcaster: 'pusher' } : { broadcaster: 'reverb' });

// A room clicked inside a room's page overlay opens in the whole window, not inside the overlay.
if (embedded) {
    router.on('before', (event) => {
        const target = new URL(event.detail.visit.url, window.location.href);
        if (target.pathname.startsWith('/rooms/')) {
            window.top!.location.href = target.href;
            return false;
        }
    });
}

// "Always play animations" (Settings, Appearance) is kept on the page for the style sheet and the character pictures,
// and "Compact" puts data-density="compact" on it, which the style sheet follows (app.css)
let systemPageUrl: string | undefined;
const motion = (page: { props: unknown; url?: string }) => {
    const auth = (page.props as PageProps).auth;
    setRegionalAccount(auth?.guest ? null : auth?.user?.id ?? null);
    applyRegional(auth?.user?.preferences);
    const appearance = auth?.user?.preferences?.appearance;
    applyMotion(appearance?.always_animate);
    syncCompactPreferences(auth?.guest ? null : auth?.user?.id ?? null, auth?.user?.preferences, page.url !== systemPageUrl);
    syncSystemPreferences(auth?.guest ? null : auth?.user?.id ?? null, auth?.user?.preferences, page.url !== systemPageUrl);
    systemPageUrl = page.url;
};
router.on('navigate', (event) => motion(event.detail.page));
router.on('success', (event) => motion(event.detail.page)); // saving the setting reloads the same page, and that is not a "navigate"

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

if (!embedded) {
    window.addEventListener('message', (event) => {
        if (event.origin === window.location.origin && event.source !== window && event.data?.type === 'sfd:regional-preview' && isLanguage(event.data.regional?.language) && ['12', '24'].includes(event.data.regional?.time_format)) previewRegional(event.data.regional);
        if (event.origin === window.location.origin && event.source !== window && event.data?.type === 'sfd:preferences-updated') {
            router.reload({ only: ['auth', 'host', 'profile', 'playback'] });
        }
    });
}

const localizedPages = new Map<string, ComponentType<Record<string, unknown>>>();

createInertiaApp({
    title: (title) => `${translate(title)} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob<{ default: ComponentType }>('./Pages/**/*.tsx'),
        ).then((page) => {
            const cached = localizedPages.get(name);
            if (cached) return cached;
            const Component = page.default;
            function LocalizedPage(props: Record<string, unknown>) {
                useSyncExternalStore(subscribeLanguage, getRegionalSnapshot, () => 'en:0');
                applyRegional((props as PageProps).auth?.user?.preferences);
                return <Component {...props} />;
            }
            localizedPages.set(name, LocalizedPage);
            return LocalizedPage;
        }),
    setup({ el, App, props }) {
        motion(props.initialPage);

        const root = createRoot(el);

        const auth = (props.initialPage.props as unknown as PageProps).auth;
        let appearanceUser = auth?.guest ? null : auth?.user?.id;
        router.on('navigate', (event) => {
            const next = (event.detail.page.props as unknown as PageProps).auth;
            appearanceUser = next?.guest ? null : next?.user?.id;
        });
        let appearanceTimer = 0;
        listenForAppearanceChanges((id) => {
            if (id !== appearanceUser) return;
            window.clearTimeout(appearanceTimer);
            appearanceTimer = window.setTimeout(() => router.reload({ only: ['auth', 'profile', 'host', 'catalog', 'coins', 'daily', 'history'] }), 80);
        });
        void loadRegionalLanguage(getLanguage()).catch(() => {}).then(() => {
            root.render(<><App {...props} /><RoomLoading /><CompactPreferenceNotice /><SystemPreferenceNotice />{!embedded && <WhisperCalls initialUser={auth?.guest ? null : auth?.user?.id ?? null} />}</>);
        });
    },
    progress: {
        color: '#4B5563',
    },
});
