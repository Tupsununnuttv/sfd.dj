import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('only the selected dictionary loads and its arrival updates mounted text', async ({ page }) => {
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto('/tests/Browser/index.html');
    await expect(page.locator('#copy')).toHaveText('Copy');
    expect(requests.some(url => /\/locales\/(et|ru)\.json/.test(url))).toBe(false);
    const et = JSON.parse(fs.readFileSync('resources/js/lib/locales/et.json', 'utf8'));
    await page.locator('#language-et').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'et');
    await expect(page.locator('#copy')).toHaveText(et.Copy);
    expect(requests.some(url => /\/locales\/et\.json/.test(url))).toBe(true);
    expect(requests.some(url => /\/locales\/ru\.json/.test(url))).toBe(false);
});
