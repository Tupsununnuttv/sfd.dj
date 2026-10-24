// Run: npx vite build --config tests/Browser/vite.memory.config.mjs
// Then: node scripts/benchmark-room-memory.mjs before (or after).
// Isolated production renderer: 37 characters, 120 chat rows, no third-party video iframe.
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = process.cwd();
const tag = process.argv[2] ?? 'sample';
const lowPerformance = process.argv.includes('--low-performance');
if (!/^[a-z0-9-]+$/i.test(tag)) throw new Error('Invalid result name');
const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const base = /^(Avatars|fonts|backgrounds)\//.test(relative) ? path.join(root, 'public') : path.join(root, 'tmp/room-memory-build');
    const file = path.resolve(base, relative);
    if (!file.startsWith(base + path.sep)) { res.writeHead(403).end(); return; }
    try {
        res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.png': 'image/png', '.woff2': 'font/woff2' })[path.extname(file)] ?? 'application/octet-stream');
        res.end(readFileSync(file));
    } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const requests = [];
    const errors = [];
    page.on('request', request => requests.push(request.url()));
    page.on('pageerror', error => errors.push(error.message));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    await page.goto(`http://127.0.0.1:${server.address().port}/tests/Browser/memory.html${lowPerformance ? '?low-performance=1' : ''}`);
    await page.waitForFunction(() => [...document.querySelectorAll('.sfd-stage img')].length > 20 && [...document.querySelectorAll('.sfd-stage img')].every(img => img.complete && img.naturalWidth > 0));
    await page.waitForTimeout(8000);
    await cdp.send('HeapProfiler.collectGarbage');
    const start = (await cdp.send('Performance.getMetrics')).metrics;
    const frames = await page.evaluate(() => new Promise(resolve => {
        const gaps = []; let previous = performance.now(); const end = previous + 5000;
        const frame = now => { gaps.push(now - previous); previous = now; if (now < end) requestAnimationFrame(frame); else resolve({ frames: gaps.length, longFrames: gaps.filter(gap => gap > 34).length, maxFrameMs: Math.max(...gaps) }); };
        requestAnimationFrame(frame);
    }));
    const end = (await cdp.send('Performance.getMetrics')).metrics;
    const value = (metrics, name) => metrics.find(metric => metric.name === name)?.value ?? 0;
    const browserCdp = await browser.newBrowserCDPSession();
    const processes = (await browserCdp.send('SystemInfo.getProcessInfo')).processInfo;
    let memory = null;
    if (process.platform === 'win32') {
        const ids = processes.map(process => process.id).join(',');
        memory = JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-Command', `Get-Process -Id ${ids} -ErrorAction SilentlyContinue | Select-Object Id,WorkingSet64,PrivateMemorySize64 | ConvertTo-Json -Compress`], { encoding: 'utf8' }));
        memory = (Array.isArray(memory) ? memory : [memory]).map(process => ({ ...process, type: processes.find(info => info.id === process.Id)?.type }));
    }
    const result = { scenario: '37 characters, 120 chat rows, Dragon scene, no video decoder', tag, frames, jsHeapMB: value(end, 'JSHeapUsedSize') / 1048576, nodes: value(end, 'Nodes'), taskSeconds: value(end, 'TaskDuration') - value(start, 'TaskDuration'), animatedCharacterRequests: requests.filter(url => /\/Avatars\/(Standing|Dancing|DJing|Animations)\//.test(url)).length, djRequests: requests.filter(url => url.includes('/Avatars/DJing/') || url.includes('.djing.')).length, memory, errors };
    result.lowPerformance = lowPerformance;
    mkdirSync('tmp/room-memory-results', { recursive: true });
    writeFileSync(`tmp/room-memory-results/${tag}.json`, JSON.stringify(result, null, 2));
    await page.screenshot({ path: `tmp/room-memory-results/${tag}.png` });
    console.log(JSON.stringify(result));
    if (errors.length) throw new Error(errors.join('\n'));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
