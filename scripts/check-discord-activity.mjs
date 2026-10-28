/** Read-only checks of the origin AND actual Discord proxy. No account/token is required. */
const args = process.argv.slice(2);
const originOnly = args.includes('--origin-only');
const positional = args.filter(arg => !arg.startsWith('--'));
if (args.some(arg => arg.startsWith('--') && arg !== '--origin-only')) throw new Error('Unknown option. Use --origin-only for a partial local check.');
const base = new URL(positional[0] || 'https://sfd-dj.eu');
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('Expected an HTTP(S) site URL without credentials.');
const expectedId = '1563979983582535841';
const proxy = new URL(`https://${expectedId}.discordsays.com`);
const room = positional[1] || 'sfddj';
if (!/^[a-zA-Z0-9_-]+$/.test(room)) throw new Error('Expected a room slug.');
let failures = 0;
function check(ok, message) {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${message}`);
    if (!ok) failures++;
}
const launch = 'frame_id=deployment-check&instance_id=deployment-check&platform=desktop';
const surfaces = [['Origin', base], ...(originOnly ? [] : [['Discord proxy', proxy]])];
for (const [label, surface] of surfaces) {
    const cookies = new Map();
    for (const [path, expectedPage] of [[`/?${launch}`, 'Room'], [`/discord?${launch}`, 'Room'], ['/discord/rooms', 'Discord/Activity'], [`/rooms/${room}`, 'Room']]) {
        console.log(`Checking ${label}: ${new URL(path, surface)}`);
        try {
            // Do not follow redirects: proxy-to-proxy redirects are the failure being checked.
            const response = await fetch(new URL(path, surface), { signal: AbortSignal.timeout(20000), redirect: 'manual', headers: {
                Cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join('; '),
                'Cache-Control': 'no-cache',
            } });
            const setCookies = response.headers.getSetCookie();
            for (const cookie of setCookies) {
                const pair = cookie.split(';', 1)[0];
                const equals = pair.indexOf('=');
                if (equals > 0) cookies.set(pair.slice(0, equals), pair.slice(equals + 1));
            }
            check(response.status === 200, `HTTP ${response.status}; entry must render without a redirect`);
            check(!response.headers.has('location'), 'No redirect into the Discord proxy');
            check(!response.headers.has('x-frame-options'), 'No X-Frame-Options header (including Cloud/edge headers)');
            const csp = response.headers.get('content-security-policy') || '';
            const policies = csp.split(',').map(policy => policy.match(/(?:^|;)\s*frame-ancestors\s+([^;]+)/i)?.[1]).filter(Boolean);
            // Discord replaces the origin CSP with its own sandbox policy. That policy may omit
            // frame-ancestors: default-src does not act as a fallback for frame-ancestors.
            // The origin must still explicitly allow both Discord and the Activity proxy.
            const isProxy = surface.origin === proxy.origin;
            const frameAllowed = isProxy
                ? policies.every(policy => {
                    const sources = policy.split(/\s+/);
                    return ['https://discord.com', 'https://canary.discord.com', 'https://ptb.discord.com'].every(parent =>
                        sources.includes('*') || sources.includes('https:') || sources.includes(parent)
                        || (parent !== 'https://discord.com' && sources.includes('https://*.discord.com')));
                })
                : policies.length > 0 && policies.every(policy => ['https://discord.com', 'https://*.discordsays.com'].every(origin => policy.split(/\s+/).includes(origin)));
            check(frameAllowed, isProxy ? 'Proxy frame-ancestors permits Discord clients (or is absent)' : 'Every origin frame-ancestors policy allows Discord and its proxy');
            check(/(?:^|,)\s*no-store(?:,|$)/i.test(response.headers.get('cache-control') || ''), 'Activity response is not shared or stored by the edge cache');
            const html = await response.text();
            const serialized = html.match(/<script\b[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/)?.[1];
            let page;
            try { page = JSON.parse(serialized || 'null'); } catch { /* Report the failed page below. */ }
            check(page?.component === expectedPage, `${expectedPage} page returned inside the Activity`);
            check(page?.props?.auth?.guest === true && page?.props?.discordActivity?.guestOnly === true, 'Activity is forced to read-only guest mode');
            if (expectedPage === 'Room') check(page?.props?.room?.slug === room, `Room is ${room}`);
            check(page?.props?.discordActivity?.applicationId === expectedId, `Application ID is ${expectedId}`);
            const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
            check(scripts.length > 0 && scripts.every(src => src.startsWith('/build/')), 'Production scripts use proxy-relative /build/ paths');
            check(!html.includes('fonts.bunny.net'), 'No unmapped external font request');
            for (const name of ['XSRF-TOKEN', 'sfd_discord_activity']) {
                const cookie = setCookies.find(value => value.startsWith(`${name}=`)) || '';
                check(/;\s*samesite=none(?:;|$)/i.test(cookie) && /;\s*secure(?:;|$)/i.test(cookie) && /;\s*partitioned(?:;|$)/i.test(cookie), `${name} supports the Discord iframe`);
            }
        } catch (error) { check(false, `${label} request failed: ${error.message}`); }
    }
}
if (!originOnly) {
    for (const [path, prefix, target] of [
        ['/_discord/youtube/iframe_api', '/_discord/youtube', 'www.youtube.com'],
        ['/_discord/soundcloud/player/api.js', '/_discord/soundcloud', 'w.soundcloud.com'],
    ]) {
        try {
            const response = await fetch(new URL(path, proxy), { redirect: 'manual', signal: AbortSignal.timeout(20000) });
            const type = response.headers.get('content-type') || 'missing Content-Type';
            const ok = response.status === 200 && /javascript|ecmascript/i.test(type);
            check(ok, `Provider URL Mapping ${path}: HTTP ${response.status}, ${type}`);
            if (!ok) console.error(`  Check Developer Portal > Activities > URL Mappings: ${prefix} -> ${target} (Target without https://). Save, then fully close and relaunch the Activity.`);
            await response.body?.cancel();
        } catch (error) { check(false, `Provider URL Mapping ${path}: ${error.message}`); }
    }
}
if (failures) {
    console.error(`${failures} checks failed. Check deployed source, Cloud headers and the application's URL Mappings.`);
    process.exitCode = 1;
} else if (originOnly) console.log('Origin-only checks passed. Discord proxy, SDK, provider playback and public access have NOT been checked.');
else console.log('Origin/proxy HTTP checks passed. Verify SDK and sound inside Discord. Access for all users additionally requires App Verification; Discovery controls launcher search.');
