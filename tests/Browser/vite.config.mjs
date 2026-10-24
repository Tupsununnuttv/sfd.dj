import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import localizedReact from '../../scripts/localized-react.mjs';
import tailwindcss from '@tailwindcss/vite';
import protectUserContent from '../../scripts/protect-user-content.mjs';

export default defineConfig({
    // Seeded application tests and the component harness share one server. Scan both
    // graphs up front so blocked-HMR tests cannot acquire different React bundles.
    optimizeDeps: {
        entries: ['resources/js/app.tsx', 'tests/Browser/harness.tsx'],
        include: ['react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@inertiajs/react', '@laravel/echo-react', 'laravel-vite-plugin/inertia-helpers', 'lucide-react', 'pusher-js', 'laravel-echo', 'qrcode'],
    },
    root: fileURLToPath(new URL('../../', import.meta.url)),
    cacheDir: 'node_modules/.vite-browser-tests',
    resolve: { alias: { '@': fileURLToPath(new URL('../../resources/js', import.meta.url)) } },
    plugins: [protectUserContent(), localizedReact(), tailwindcss()],
    server: { host: '127.0.0.1', port: 4175, strictPort: true, warmup: { clientFiles: ['./tests/Browser/harness.tsx'] } },
});
