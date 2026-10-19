import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    build: {
        target: ['chrome111', 'edge111', 'firefox128', 'safari16.4'],
        cssTarget: ['chrome111', 'edge111', 'firefox128', 'safari16.4'],
    },
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
});
