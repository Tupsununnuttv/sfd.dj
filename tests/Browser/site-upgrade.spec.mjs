import { test, expect as baseExpect } from '@playwright/test';
const expect = baseExpect.configure({ timeout: 30000 });

test('anonymous viewers appear to members, room cards identify selfbots and all four connection controls render', async ({ page, context, browser }, testInfo) => {
    test.skip(process.env.BROWSER_SITE_TEST !== '1', 'Requires isolated site fixtures and persistent disposable cache.');
    test.setTimeout(120000);
    const base = process.env.BROWSER_APP_URL;
    if (!base || !['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local fixtures only.');
    const errors = [];
    const setup = async target => {
        await target.route(/^http:\/\/(\[::1\]|localhost|127\.0\.0\.1):5173\//, async route => {
            const url = new URL(route.request().url());
            await route.fulfill({ response: await route.fetch({ url: `http://127.0.0.1:4175${url.pathname}${url.search}`, maxRetries: 2 }) });
        });
        await target.routeWebSocket(/.*/, socket => socket.close());
        target.on('page', opened => opened.on('pageerror', error => errors.push(error.message)));
    };
    await setup(context);
    page.on('pageerror', error => errors.push(error.message));
    const anonymous = await browser.newContext();
    await setup(anonymous);
    try {
        const watcher = await anonymous.newPage();
        const roomPath = `/rooms/browser-shop-${testInfo.project.name}`;
        await watcher.goto(base + roomPath);
        await expect(watcher.locator('[data-room-watchers]')).toContainText('1 guest watching');
        const anotherTab = await anonymous.newPage();
        await anotherTab.goto(base + roomPath);
        await expect(anotherTab.locator('[data-room-watchers]')).toContainText('1 guest watching');
        await page.goto(`${base}/login`);
        await page.getByLabel('Email or username').fill(`${testInfo.project.name}@browser-test.invalid`);
        await page.getByLabel('Password', { exact: true }).fill('Browser-Test-Only-9284!');
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await expect(page).not.toHaveURL(/\/login$/);
        await page.goto(base + roomPath);
        await page.locator('[data-room-watchers]').click();
        const guests = page.locator('[data-role-group="Guests"]');
        await expect(guests.locator('[data-guest-id]')).toHaveCount(1);
        await expect(guests).toContainText('Watching without an account');
        await expect(guests.getByRole('button')).toHaveCount(0);
        if (testInfo.project.name === 'chromium') await page.screenshot({ path: testInfo.outputPath('room-guests.png') });
        await page.goto(`${base}/dashboard`);
        const card = page.locator('[data-room-name]').filter({ has: page.getByRole('heading', { name: `Shop test ${testInfo.project.name}`, exact: true }) }).first();
        await expect(card.locator('[data-selfbot]')).toHaveText(`Selfbot: Night Radio ${testInfo.project.name}`);
        await expect(card).toContainText('1 listener');
        await page.goto(`${base}/settings/connections`);
        for (const label of ['Reddit', 'Instagram', 'Facebook', 'X / Twitter']) {
            await page.getByRole('button', { name: `Connect ${label}`, exact: true }).click();
            await expect(page.getByText(`${label} linking is not configured on this site yet.`, { exact: true })).toBeVisible();
        }
        if (testInfo.project.name === 'chromium') await page.screenshot({ path: testInfo.outputPath('connections.png'), fullPage: true });
        expect(errors).toEqual([]);
    } finally { await anonymous.close(); }
});
