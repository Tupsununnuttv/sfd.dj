import '../css/app.css';

import RoomLoading from '@/Components/RoomLoading';
import WhisperCalls from '@/Components/WhisperCalls';
import CompactPreferenceNotice from '@/Components/CompactPreferenceNotice';
import { syncCompactPreferences } from '@/lib/compactPreferences';
import { embedded } from '@/lib/embed';
import { applyMotion } from '@/lib/motion';
import { PageProps } from '@/types';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { configureEcho } from '@laravel/echo-react';

// live updates: Reverb on this computer, Pusher on the live site (VITE_BROADCASTER=pusher when it is built); the keys come from the VITE_REVERB_ / VITE_PUSHER_ variables
configureEcho(import.meta.env.VITE_BROADCASTER === 'pusher' ? { broadcaster: 'pusher' } : { broadcaster: 'reverb' });

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
const motion = (page: { props: unknown }) => {
    const auth = (page.props as PageProps).auth;
    const appearance = auth?.user?.preferences?.appearance;
    applyMotion(appearance?.always_animate);
    syncCompactPreferences(auth?.guest ? null : auth?.user?.id ?? null, auth?.user?.preferences);
};
router.on('navigate', (event) => motion(event.detail.page));
router.on('success', (event) => motion(event.detail.page)); // saving the setting reloads the same page, and that is not a "navigate"

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

if (!embedded) {
    window.addEventListener('message', (event) => {
        if (event.origin === window.location.origin && event.source !== window && event.data?.type === 'sfd:preferences-updated') {
            router.reload({ only: ['auth'] });
        }
    });
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob<{ default: ComponentType }>('./Pages/**/*.tsx'),
        ).then((page) => page.default),
    setup({ el, App, props }) {
        motion(props.initialPage);

        const root = createRoot(el);

        const auth = (props.initialPage.props as unknown as PageProps).auth;
        root.render(<><App {...props} /><RoomLoading /><CompactPreferenceNotice />{!embedded && <WhisperCalls initialUser={auth?.guest ? null : auth?.user?.id ?? null} />}</>);
    },
    progress: {
        color: '#4B5563',
    },
});
