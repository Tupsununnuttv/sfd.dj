/** Read-only post-deploy check. Does not initialize the SDK outside Discord. */
const base = new URL(process.argv[2] || 'https://sfd-dj.eu');
if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Expected an HTTP(S) site URL.');
const expectedId = '1563979983582535841';
const room = process.argv[3] || 'sfddj';
if (!/^[a-zA-Z0-9_-]+$/.test(room)) throw new Error('Expected a room slug.');
let failures = 0;
const cookies = new Map();
function check(ok, message) {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${message}`);
    if (!ok) failures++;
}
for (const [path, expectedPage] of [['/?frame_id=deployment-check&instance_id=deployment-check&platform=desktop', 'Room'], ['/discord/rooms', 'Discord/Activity'], [`/rooms/${room}`, 'Room']]) {
    console.log(`Checking ${new URL(path, base)}`);
    let target = new URL(path, base);
    let response;
    for (let hop = 0; hop < 5; hop++) {
        response = await fetch(target, { signal: AbortSignal.timeout(20000), redirect: 'manual', headers: { Cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join('; ') } });
        for (const cookie of response.headers.getSetCookie()) {
            const pair = cookie.split(';', 1)[0];
            const equals = pair.indexOf('=');
            if (equals > 0) cookies.set(pair.slice(0, equals), pair.slice(equals + 1));
        }
        if (![301, 302, 303, 307, 308].includes(response.status)) break;
        const destination = new URL(response.headers.get('location'), target);
        if (![base.origin, `https://${expectedId}.discordsays.com`].includes(destination.origin)) throw new Error('Unexpected external redirect.');
        // Check the backend through its public host, preserving the proxied path.
        target = new URL(`${destination.pathname}${destination.search}`, base);
    }
    check(response.status === 200, `HTTP ${response.status}`);
    check(!response.headers.has('x-frame-options'), 'No X-Frame-Options header (including Cloud/edge headers)');
    const csp = response.headers.get('content-security-policy') || '';
    const policies = csp.split(',').map(policy => policy.match(/(?:^|;)\s*frame-ancestors\s+([^;]+)/i)?.[1]).filter(Boolean);
    check(policies.length > 0 && policies.every(policy => ['https://discord.com', 'https://*.discordsays.com'].every(origin => policy.split(/\s+/).includes(origin))), 'Every frame-ancestors policy allows Discord and its proxy');
    const html = await response.text();
    const serialized = html.match(/<script\b[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    let page;
    try { page = JSON.parse(serialized || 'null'); } catch { /* Report a failed page check below. */ }
    check(page?.component === expectedPage, `${expectedPage} page returned inside the Activity`);
    check(page?.props?.auth?.guest === true && page?.props?.discordActivity?.guestOnly === true, 'Activity is forced to read-only guest mode');
    if (expectedPage === 'Room') check(page?.props?.room?.slug === room, `Room is ${room}`);
    check(page?.props?.discordActivity?.applicationId === expectedId, `Application ID is ${expectedId}`);
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
    check(scripts.length > 0 && scripts.every(src => src.startsWith('/build/')), 'Production scripts use proxy-relative /build/ paths');
    check(!html.includes('fonts.bunny.net'), 'No unmapped external font request');
    for (const name of ['XSRF-TOKEN', 'sfd_discord_activity']) {
        const cookie = response.headers.getSetCookie().find(value => value.startsWith(`${name}=`)) || '';
        check(/;\s*samesite=none(?:;|$)/i.test(cookie) && /;\s*secure(?:;|$)/i.test(cookie) && /;\s*partitioned(?:;|$)/i.test(cookie), `${name} supports the Discord iframe`);
    }
}
if (failures) {
    console.error(`${failures} checks failed. Inspect Laravel Cloud response headers, deployed source and build settings.`);
    process.exitCode = 1;
} else console.log('HTTP checks passed. Launch the Activity inside Discord to verify the real SDK handshake.');
