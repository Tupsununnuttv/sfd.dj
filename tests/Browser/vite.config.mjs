import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    root: fileURLToPath(new URL('../../', import.meta.url)),
    cacheDir: 'node_modules/.vite-browser-tests',
    resolve: { alias: { '@': fileURLToPath(new URL('../../resources/js', import.meta.url)) } },
    plugins: [react(), tailwindcss()],
    server: { host: '127.0.0.1', port: 4175, strictPort: true, warmup: { clientFiles: ['./tests/Browser/harness.tsx'] } },
});
