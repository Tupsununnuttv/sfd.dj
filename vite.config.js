import { defineConfig } from 'vite';
import protectUserContent from './scripts/protect-user-content.mjs';
import laravel from 'laravel-vite-plugin';
import localizedReact from './scripts/localized-react.mjs';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    build: {
        target: ['chrome111', 'edge111', 'firefox128', 'safari16.4'],
        cssTarget: ['chrome111', 'edge111', 'firefox128', 'safari16.4'],
    },
    plugins: [
        protectUserContent(),
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        localizedReact(),
        tailwindcss(),
    ],
});
