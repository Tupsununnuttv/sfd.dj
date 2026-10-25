/** Read-only post-deploy check. Does not initialize the SDK outside Discord. */
const base = new URL(process.argv[2] || 'https://sfd-dj.eu');
if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Expected an HTTP(S) site URL.');
const expectedId = '1563979983582535841';
let failures = 0;
function check(ok, message) {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${message}`);
    if (!ok) failures++;
}
for (const path of ['/?frame_id=deployment-check&instance_id=deployment-check&platform=desktop', '/discord?frame_id=deployment-check&instance_id=deployment-check&platform=desktop']) {
    console.log(`Checking ${new URL(path, base)}`);
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20000), redirect: 'manual' });
    check(response.status === 200, `HTTP ${response.status}`);
    check(!response.headers.has('x-frame-options'), 'No X-Frame-Options header (including Cloud/edge headers)');
    const csp = response.headers.get('content-security-policy') || '';
    const policies = csp.split(',').map(policy => policy.match(/(?:^|;)\s*frame-ancestors\s+([^;]+)/i)?.[1]).filter(Boolean);
    check(policies.length > 0 && policies.every(policy => ['https://discord.com', 'https://*.discordsays.com'].every(origin => policy.split(/\s+/).includes(origin))), 'Every frame-ancestors policy allows Discord and its proxy');
    const html = await response.text();
    const serialized = html.match(/<script\b[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    let page;
    try { page = JSON.parse(serialized || 'null'); } catch { /* Report a failed page check below. */ }
    check(page?.component === 'Discord/Activity', 'Activity page returned');
    check(page?.props?.applicationId === expectedId, `Application ID is ${expectedId}`);
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
    check(scripts.length > 0 && scripts.every(src => src.startsWith('/build/')), 'Production scripts use proxy-relative /build/ paths');
    check(!html.includes('fonts.bunny.net'), 'No unmapped external font request');
    for (const name of ['XSRF-TOKEN', 'sfd_device']) {
        const cookie = response.headers.getSetCookie().find(value => value.startsWith(`${name}=`)) || '';
        check(/;\s*samesite=none(?:;|$)/i.test(cookie) && /;\s*secure(?:;|$)/i.test(cookie) && /;\s*partitioned(?:;|$)/i.test(cookie), `${name} supports the Discord iframe`);
    }
}
if (failures) {
    console.error(`${failures} checks failed. Inspect Laravel Cloud response headers, deployed source and build settings.`);
    process.exitCode = 1;
} else console.log('HTTP checks passed. Launch the Activity inside Discord to verify the real SDK handshake.');
