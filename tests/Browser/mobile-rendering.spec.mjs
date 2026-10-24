import { test, expect } from '@playwright/test';

test.setTimeout(120000);
const url = 'http://127.0.0.1:4175/tests/Browser/index.html?mobile-room=1';

for (const device of [
    { name: 'phone portrait', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
    { name: 'landscape desktop-site mode', viewport: { width: 1024, height: 640 }, isMobile: false, hasTouch: true, deviceScaleFactor: 2 },
]) {
    test(`${device.name}: no glass layers or animated avatar thumbnails, with video and dance poses retained`, async ({ browser }, testInfo) => {
        const { name, ...options } = device;
        const context = await browser.newContext(options);
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(url);
        await expect(page.locator('.sfd-room')).toHaveAttribute('data-rendering', 'touch');
        await expect(page.locator('.sfd-stage svg').first()).toBeVisible();
        await expect.poll(() => page.locator('.sfd-navbar .sfd-avatar img').getAttribute('src')).toMatch(/\/Avatars\/Previews\/kaida\./);
        await expect.poll(() => page.locator('.sfd-navbar .sfd-avatar img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
        const styles = await page.evaluate(() => ({
            backdrop: getComputedStyle(document.querySelector('.sfd-navbar')).backdropFilter || getComputedStyle(document.querySelector('.sfd-navbar')).webkitBackdropFilter,
            filter: getComputedStyle(document.querySelector('.sfd-avatar')).filter,
            animation: getComputedStyle(document.querySelector('.sfd-avatar svg g')).animationName,
            containment: getComputedStyle(document.querySelector('.sfd-stage')).contain,
        }));
        expect(styles).toEqual({ backdrop: 'none', filter: 'none', animation: 'none', containment: 'paint' });
        await expect(page.locator('.snow')).toHaveCount(0);
        await expect(page.locator('.sfd-stage .sc-live')).toHaveCount(0);
        await expect(page.locator('.sfd-stage img[src*="/Dancing/"], .sfd-stage img[src*=".dancing."]')).toHaveCount(2);
        await expect(page.locator('.sfd-stage img[src*="/DJing/"]')).toHaveCount(1);
        await page.locator('[data-test-video]').evaluate((element) => { element.dataset.instance = 'original'; });
        // Span the supplied recording's ~13 seconds, including the middle where its UI disappears.
        for (let frame = 0; frame < 4; frame++) {
            if (frame) await page.waitForTimeout(4250);
            await page.getByRole('button', { name: frame % 2 ? 'Chat' : 'Users', exact: true }).click();
            await page.locator('.sfd-chat').evaluate((element, i) => { element.scrollTop = i * 130; }, frame);
            const png = await page.screenshot({ scale: 'css', path: testInfo.outputPath(`${name.replaceAll(' ', '-')}-${frame}.png`) });
            const markers = await page.locator('[data-render-marker], [data-chat-marker]').evaluateAll((elements) => elements.map((element) => {
                const rect = element.getBoundingClientRect();
                const clip = element.closest('.sfd-chat')?.getBoundingClientRect();
                return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: clip?.top ?? 0, bottom: clip?.bottom ?? innerHeight };
            }).filter((rect) => rect.y >= rect.top && rect.y + rect.height <= rect.bottom && rect.x >= 0 && rect.x + rect.width <= innerWidth).slice(0, 3));
            const pixels = await page.evaluate(async ({ png, markers }) => {
                const image = new Image(); image.src = `data:image/png;base64,${png}`; await image.decode();
                const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
                const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
                return markers.map((marker) => Array.from(context.getImageData(Math.floor(marker.x + marker.width / 2), Math.floor(marker.y + marker.height / 2), 1, 1).data));
            }, { png: png.toString('base64'), markers });
            expect(pixels.length).toBeGreaterThan(1);
            expect(pixels.every((pixel) => pixel.slice(0, 3).every((value) => value > 230))).toBe(true);
            await expect(page.locator('[data-test-video]')).toHaveAttribute('data-instance', 'original');
        }
        await page.setViewportSize({ width: device.viewport.height, height: device.viewport.width });
        await expect(page.locator('.sfd-room')).toHaveAttribute('data-rendering', 'touch');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const fullscreen = page.getByRole('button', { name: 'Video fullscreen', exact: true });
        if (await fullscreen.isEnabled()) {
            await fullscreen.click();
            await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
            const screen = await page.locator('.sfd-playbackscreen').boundingBox();
            expect(Math.round(screen.width)).toBe(page.viewportSize().width);
            await page.getByRole('button', { name: 'Exit video fullscreen', exact: true }).click();
            await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
            await expect(page.locator('[data-test-video]')).toHaveAttribute('data-instance', 'original');
        }
        expect(errors).toEqual([]);
        await context.close();
    });
}

test('ordinary desktop keeps animated scenery and uses static avatar thumbnails', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: false });
    const page = await context.newPage();
    await page.goto(url);
    await expect(page.locator('.sfd-room')).toHaveAttribute('data-rendering', 'full');
    await expect(page.locator('.sfd-navbar .sfd-avatar img')).toHaveAttribute('src', /\/Avatars\/Previews\/kaida\./);
    await expect(page.locator('.sfd-stage .sc-live').first()).toBeVisible();
    await expect(page.locator('.snow')).toHaveCount(3);
    expect(await page.locator('.sfd-navbar').evaluate((element) => getComputedStyle(element).backdropFilter || getComputedStyle(element).webkitBackdropFilter)).toBe('blur(14px)');
    await context.close();
});

test('iPad desktop identification with a fine pointer still selects touch rendering', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: false });
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
        Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
    });
    const page = await context.newPage();
    await page.goto(url);
    await expect(page.locator('.sfd-room')).toHaveAttribute('data-rendering', 'touch');
    await expect(page.locator('.sfd-navbar .sfd-avatar img')).toHaveAttribute('src', /\/Avatars\/Previews\//);
    await context.close();
});
