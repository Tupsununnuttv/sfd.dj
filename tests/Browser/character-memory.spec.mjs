import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const posters = JSON.parse(fs.readFileSync('resources/js/lib/characterPosters.json', 'utf8'));
const animations = JSON.parse(fs.readFileSync('resources/js/lib/characterAnimations.json', 'utf8'));

test('room only loads active poses and uses still character thumbnails', async ({ page }) => {
    const requested = [];
    page.on('request', request => requested.push(request.url()));
    await page.goto('/tests/Browser/index.html?mobile-room');
    await expect(page.locator('.sfd-navbar .sfd-avatar img')).toHaveAttribute('src', posters.kaida);
    await expect(page.locator('.sfd-stage img[src*=".dancing."]')).toHaveAttribute('src', animations.kaida.dancing);
    await expect(page.locator('.sfd-stage img[src*="/DJing/"]')).toHaveCount(1);
    await page.waitForTimeout(250);
    expect(requested.filter(url => url.includes('/DJing/'))).toHaveLength(1);
    expect(requested.filter(url => url.includes('/DJing/kaida'))).toHaveLength(0);
    expect(requested.filter(url => url.includes('/Standing/kaida'))).toHaveLength(0);
});

test('pre-rendered poses animate and GIF thumbnails stay still with transparency intact', async ({ page }) => {
    await page.goto('/tests/Browser/index.html');
    await page.setContent(`<body style="background:#ddd"><img id="animation" src="${animations.kaida.dancing}" style="width:200px;height:276px"><img id="poster" src="${posters.dragone04}" style="width:220px;height:110px"></body>`);
    await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth));
    const animation = page.locator('#animation');
    const poster = page.locator('#poster');
    const firstPose = await animation.screenshot();
    const firstPoster = await poster.screenshot();
    await page.waitForTimeout(450);
    expect((await animation.screenshot()).equals(firstPose)).toBe(false);
    expect((await poster.screenshot()).equals(firstPoster)).toBe(true);
    expect(await poster.evaluate(img => {
        const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const context = canvas.getContext('2d'); context.drawImage(img, 0, 0);
        return context.getImageData(0, 0, 1, 1).data[3];
    })).toBe(0);
});

test('reduced motion uses the SVG pose and always-animate overrides it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/tests/Browser/index.html?mobile-room');
    await expect(page.locator('.sfd-stage img[src*="/Dancing/kaida"]')).toBeVisible();
    expect(await page.evaluate(async () => {
        document.documentElement.dataset.motion = 'always';
        const { characterUrl } = await import('/resources/js/lib/characters.ts');
        return characterUrl('kaida', 'dancing');
    })).toBe(animations.kaida.dancing);
});
