import { defineConfig } from '@playwright/test';
import base from './playwright.config.mjs';

export default defineConfig({
    ...base,
    testMatch: 'mobile-rendering.spec.mjs',
    testIgnore: [],
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
        { name: 'webkit', use: { browserName: 'webkit' } },
    ],
});
