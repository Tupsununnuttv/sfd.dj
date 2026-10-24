import { test, expect as baseExpect } from '@playwright/test';
const expect = baseExpect.configure({ timeout: 30000 });

test('language and clock settings persist and fit a mobile screen', async ({ page, context }, testInfo) => {
    test.skip(process.env.BROWSER_SHOP_TEST !== '1', 'Requires the isolated seeded test server.');
    test.setTimeout(120000);
    const base = process.env.BROWSER_APP_URL;
    // A developer's public/hot may point at a different Vite instance. Use the isolated test Vite server.
    await context.route(/^http:\/\/(\[::1\]|localhost|127\.0\.0\.1):5173\//, async (route) => {
        const url = new URL(route.request().url());
        const response = await route.fetch({ url: `http://127.0.0.1:4175${url.pathname}${url.search}` });
        await route.fulfill({ response });
    });
    await context.routeWebSocket(/.*/, (socket) => socket.close());
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/login`);
    await page.getByLabel('Email or username').fill(`${testInfo.project.name}@browser-test.invalid`);
    await page.getByLabel('Password', { exact: true }).fill('Browser-Test-Only-9284!');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).not.toHaveURL(/\/login$/);
    await page.goto(`${base}/settings/language-time`);
    for (const [language, title] of [['et', 'Keel ja kellaaeg'], ['ru', 'Язык и время'], ['en', 'Language & Time']]) {
        await page.locator('#language').selectOption(language);
        await page.locator('#time-format').selectOption('12');
        await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
        await expect(page.getByRole('status')).toHaveText(language === 'et' ? 'Muudatused salvestatud.' : language === 'ru' ? 'Изменения сохранены.' : 'Changes saved.');
        await page.reload();
        await expect(page.locator('#language')).toHaveValue(language);
        await expect(page.locator('#time-format')).toHaveValue('12');
        await expect(page.locator('html')).toHaveAttribute('lang', language);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#time-format').selectOption('24');
    await expect(page.getByRole('status')).toHaveText('Changes saved.');
    await expect(page.getByText('13:00', { exact: true })).toBeVisible();
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
    await page.screenshot({ path: testInfo.outputPath('language-time-mobile.png'), fullPage: true });
    expect(errors).toEqual([]);
});
