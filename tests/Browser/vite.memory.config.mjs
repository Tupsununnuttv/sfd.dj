import { defineConfig } from 'vite';
import base from './vite.config.mjs';

export default defineConfig({
    ...base,
    build: { outDir: 'tmp/room-memory-build', emptyOutDir: true, copyPublicDir: false, rollupOptions: { input: 'tests/Browser/memory.html' } },
});
