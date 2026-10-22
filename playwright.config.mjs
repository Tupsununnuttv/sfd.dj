import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const webServer = [{ command: 'npx vite --config tests/Browser/vite.config.mjs', url: 'http://127.0.0.1:4175/tests/Browser/index.html', reuseExistingServer: !process.env.CI }];
if (process.env.BROWSER_SHOP_TEST === '1') {
    process.env.BROWSER_APP_URL = 'http://127.0.0.1:8012';
    webServer.push({
        command: 'php tests/Browser/seed-shop.php && php artisan serve --host=127.0.0.1 --port=8012 --no-reload',
        url: process.env.BROWSER_APP_URL + '/login',
        reuseExistingServer: false,
        env: {
            APP_ENV: 'testing', APP_CONFIG_CACHE: 'bootstrap/cache/config.testing-never.php', INERTIA_SSR_ENABLED: 'false',
            DB_CONNECTION: 'sqlite', DB_URL: '', DB_DATABASE: fileURLToPath(new URL('./tmp/browser-tests.sqlite', import.meta.url)),
            CACHE_STORE: 'array', SESSION_DRIVER: 'file', SESSION_COOKIE: 'sfd_browser_test',
            APP_URL: process.env.BROWSER_APP_URL, BROADCAST_CONNECTION: 'null', UPLOADS_DISK: 'local',
        },
    });
}

const projects = [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
];
if (process.platform === 'win32') {
    if (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')) projects.push({ name: 'chrome', use: { browserName: 'chromium', channel: 'chrome' } });
    if (existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')) projects.push({ name: 'edge', use: { browserName: 'chromium', channel: 'msedge' } });
    const opera = process.env.OPERA_GX_PATH || `${process.env.LOCALAPPDATA}/Programs/Opera GX/opera.exe`;
    if (existsSync(opera)) projects.push({ name: 'opera-gx', use: { browserName: 'chromium', launchOptions: { executablePath: opera } } });
}

export default defineConfig({
    testDir: './tests/Browser',
    testIgnore: 'mobile-rendering.spec.mjs',
    timeout: 60000,
    workers: 2,
    use: { baseURL: 'http://127.0.0.1:4175', headless: true, trace: 'retain-on-failure' },
    projects,
    webServer,
});
