import { test, expect as baseExpect } from '@playwright/test';
const expect = baseExpect.configure({ timeout: 30000 });

test('both billing periods share perk limits and mobile comparison scrolls', async ({ page, context }, testInfo) => {
    test.skip(process.env.BROWSER_SHOP_TEST !== '1', 'Requires the isolated test server.');
    test.setTimeout(120000);
    await context.route(/^http:\/\/(\[::1\]|localhost|127\.0\.0\.1):5173\//, async (route) => {
        const url = new URL(route.request().url());
        await route.fulfill({ response: await route.fetch({ url: `http://127.0.0.1:4175${url.pathname}${url.search}`, maxRetries: 2 }) });
    });
    await context.routeWebSocket(/.*/, (socket) => socket.close());
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${process.env.BROWSER_APP_URL}/pricing`);
    await expect(page.getByRole('heading', { name: 'Monthly subscription perks' })).toBeVisible();
    const table = page.getByRole('table');
    await expect(table.getByRole('row').filter({ hasText: /^XP boost/ })).toHaveText(/\+5%.*\+10%.*\+15%.*\+20%.*\+25%.*\+30%/);
    await expect(table.getByRole('row').filter({ hasText: /^Playlists/ })).toHaveText(/120.*150.*175.*200.*250.*350/);
    const bronze = page.locator('[data-plan="bronze"]');
    await bronze.locator('summary').click();
    await expect(bronze.getByText('Profile frame · Simple', { exact: true })).toBeVisible();
    await expect(bronze.getByText('Included customization', { exact: true })).toBeVisible();
    const monthlyLimits = await table.locator('tbody tr').allTextContents();
    await page.getByRole('button', { name: /^Yearly/ }).click();
    await expect(page.getByRole('heading', { name: 'Yearly subscription perks' })).toBeVisible();
    expect(await table.locator('tbody tr').allTextContents()).toEqual(monthlyLimits);
    await expect(page.locator('[data-plan="premium"]')).toContainText('€99.99');
    await table.scrollIntoViewIfNeeded();
    await table.screenshot({ path: testInfo.outputPath('perk-comparison-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    const region = page.getByRole('region', { name: 'Subscription perk comparison, scroll horizontally' });
    await region.scrollIntoViewIfNeeded();
    expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    expect(await page.locator('body').evaluate((el) => el.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('perk-comparison-mobile.png') });
    expect(errors).toEqual([]);
});
