import { test, expect } from '@playwright/test';

test('TikTok LIVE shows an external watch link and never creates an iframe', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/tests/Browser/index.html?live=tiktok');
    const watch = page.getByRole('link', { name: 'Watch on TikTok' });
    await expect(watch).toBeVisible();
    await expect(watch).toHaveAttribute('href', 'https://www.tiktok.com/@test_creator/live');
    await expect(watch).toHaveAttribute('target', '_blank');
    await expect(page.locator('iframe')).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(watch).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
});

test('Twitch keeps its official player and the current parent hostname', async ({ page }) => {
    await page.route('https://player.twitch.tv/**', (route) => route.fulfill({ body: '<html><body>Fake Twitch player</body></html>', contentType: 'text/html' }));
    await page.goto('/tests/Browser/index.html?live=twitch');
    const frame = page.getByTitle('Test live set, live on Twitch');
    await expect(frame).toBeVisible();
    const url = new URL(await frame.getAttribute('src'));
    expect(url.hostname).toBe('player.twitch.tv');
    expect(url.searchParams.get('channel')).toBe('test_creator');
    expect(url.searchParams.get('parent')).toBe('127.0.0.1');
});
