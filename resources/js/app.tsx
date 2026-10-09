import '../css/app.css';

import { embedded } from '@/lib/embed';
import { applyMotion } from '@/lib/motion';
import { PageProps } from '@/types';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
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

// "Always play animations" (Settings, Appearance) is kept on the page for the style sheet and the character pictures
const motion = (page: { props: unknown }) => applyMotion((page.props as PageProps).auth?.user?.preferences?.appearance?.always_animate);
router.on('navigate', (event) => motion(event.detail.page));
router.on('success', (event) => motion(event.detail.page)); // saving the setting reloads the same page, and that is not a "navigate"

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        motion(props.initialPage);

        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
