import { Card, EmptyState, fieldClass } from '@/Components/ui';
import { CSS_HOOKS } from '@/lib/cssHooks';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Check, Copy, Search } from 'lucide-react';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';

interface Section {
    id: string;
    icon: string;
    title: string;
    summary: string;
    body: ReactNode;
}

const P = ({ children }: { children: ReactNode }) => <p className="text-sm leading-relaxed text-neutral-300">{children}</p>;
const List = ({ items }: { items: ReactNode[] }) => (
    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-300">{items.map((i, n) => <li key={n}>{i}</li>)}</ul>
);
const H = ({ children }: { children: ReactNode }) => <h3 className="pt-3 text-sm font-bold text-white">{children}</h3>;
const K = ({ children }: { children: ReactNode }) => <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-violet-300">{children}</code>;

/** A tip or a warning set apart from the text. */
const Note = ({ tone = 'tip', children }: { tone?: 'tip' | 'warn'; children: ReactNode }) => (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tone === 'tip' ? 'border-violet-500/30 bg-violet-500/10 text-violet-100' : 'border-amber-500/30 bg-amber-500/10 text-amber-100'}`}>
        <span className="mr-1.5 font-bold">{tone === 'tip' ? '💡 Tip:' : '⚠️ Careful:'}</span>{children}
    </div>
);

/** Code with a copy button. */
function Code({ children }: { children: string }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard?.writeText(children).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="relative">
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-neutral-950 p-4 pr-14 text-xs leading-relaxed text-neutral-300">{children}</pre>
            <button onClick={copy} aria-label="Copy" className="absolute right-2 top-2 rounded-lg bg-white/10 p-2 text-neutral-300 hover:bg-white/20 hover:text-white">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
        </div>
    );
}

const origin = () => (typeof window === 'undefined' ? 'https://your-site' : window.location.origin);

const sections: Section[] = [
    {
        id: 'start',
        icon: '🚀',
        title: 'Getting started',
        summary: 'What SFD.DJ is, and what a guest can do.',
        body: (
            <>
                <P>SFD.DJ is a set of live music rooms. Everyone in a room hears the same song at the same second and can chat while it plays.</P>
                <List
                    items={[
                        'Guests can open the dashboard, any public room, the community page, events and these docs. Guests can watch and read, nothing more.',
                        'Register for free to chat, vote, DJ, make playlists and add friends. We email you a link to confirm your address; while the site cannot send email, or staff left the confirming optional, you get in without it.',
                        'The music starts by itself when you enter a room. A browser that holds the sound back until you click plays the video muted: the first click anywhere turns the sound on.',
                        'Log in with your email or your username. The volume you set is remembered in your browser.',
                    ]}
                />
            </>
        ),
    },
    {
        id: 'rooms',
        icon: '🏠',
        title: 'Rooms and the waitlist',
        summary: 'Create rooms, join the queue, lock and cycle it.',
        body: (
            <>
                <P>Create a room on the dashboard with a name, a description, a genre and, if you like, the private switch (only you and SFD.DJ staff can enter a private room).</P>
                <H>The waitlist</H>
                <List
                    items={[
                        'The first song added starts playing. The rest wait in order.',
                        'The card to the left of the DJ booth is Join Waitlist (blue) while you are not in the line: it puts you in the line, in the Waitlist tab (with no playlist yet, your playlists open). When it is your turn, the top track of your active playlist plays. In the line, or at the decks, it is Leave Waitlist (orange) and takes you out. The waitlist holds 67 people at most (the Waitlist tab shows how many, for example 3/67); a full one says Waitlist full. Its second line is how long it is until your song plays (ETA).',
                        'You can skip your own song. Skipping other people\'s songs needs the Skip permission in the room.',
                        'A locked waitlist only takes songs from people who manage the queue. With cycling on, played songs go to the back of the line.',
                    ]}
                />
                <H>The room</H>
                <P>A room is a club. The video plays on the big screen at the back. The DJ booth is at the bottom, against the footbar: the DJ, whoever's song is playing, stands at the decks with their back to us, looking at the screen, Join Waitlist is to the left of the booth and Woot, Grab and Meh are to the right. Everybody else in the room stands on the floor above the stage until they press Woot or Grab; then they dance. Press Meh and you stand again. Click anyone for their quick profile. The host can change the colours of the club in Room settings → Background, and only the host can turn it into a custom scene: a Halloween graveyard, a witch's lair (Halloween V2), a Christmas night, Christmas Eve by the fireplace (Christmas V2) (these four are under Special), a winter, spring, Easter, summer or Midsummer scene, a synthwave or retrowave night, Midnight Definity, Anime, LATAM, Lightshow, Cat café, Gold Mine, Skull, Skulls, Ultra Music Festival, Foxy, Dragon, Tastycat, Tasty or Monstercat, or a picture of your own that you upload there (PNG, JPG or WebP, at least 800 × 450).</P>
                <H>Room info and badges</H>
                <P>Room info (open More in the bar at the bottom of the room) shows the room's banner, what is playing, how many people listen and how many songs were played, the host, who is on the room team, the welcome message and the rules, and lets you copy the room link. Rooms that SFD.DJ staff trust can carry the badges <K>◆ Official</K>, <K>✓ Verified</K> and <K>★ Partnered</K>, one or several at once. Staff switch them on and off in the admin panel, Rooms tab.</P>
                <H>Room rules</H>
                <P>Room settings → Rules (anyone who may edit the room settings): write up to ten rules, each with a short title and a few words under it. Everybody who comes into the room reads them first and presses “I agree”; “Do not show again in this room” keeps the window away until the rules change. When the host changes the rules, everybody in the room reads them again, at once. The host is never asked, and Preview shows the window as people see it.</P>
                <H>Room CSS</H>
                <P>Room settings → Room CSS (the host and SFD.DJ staff): your own CSS for the room. Everybody who comes in gets it the moment you save it, and nothing outside the room changes. Pick the parts of the room with these classes, with a dot in front, for example <K>.sfd-chat</K>; add <K>:hover</K>, <K>::before</K> or a tag below it (<K>.sfd-chat a</K>) if you like.</P>
                <List items={CSS_HOOKS.map(([key, text]) => <><K>.sfd-{key}</K> {text}</>)} />
                <List
                    items={[
                        'Allowed: colours, fonts, sizes, borders, shadows, gradients, filters, transforms, custom properties, @media and @keyframes animations. Pictures with url() must be https links (they load from that site, so only use sites you trust) or a path on this site.',
                        'Not allowed: @import, @font-face, ids, [attribute] selectors, :is() and :has(), tags that are not under one of the classes above, position: fixed and sticky, and anything that runs code. The editor lists what was left out after you save.',
                        'Only the harmless part is ever put on the room, however it was written: the host sees what they typed, everybody else gets the cleaned copy.',
                    ]}
                />
                <Note>Start from one of the buttons in the editor (Neon chat, Glass bars, Glowing pictures, Big chat text, Pulsing Woot buttons) and change the colours.</Note>
            </>
        ),
    },
    {
        id: 'playlists',
        icon: '📚',
        title: 'Playlists and importing',
        summary: 'Your songs from YouTube, SoundCloud and Spotify.',
        body: (
            <>
                <List
                    items={[
                        'Create up to 30 playlists with up to 5,000 songs each; Plus and Premium raise that to 10,000 and 20,000. Pressing Grab in a room asks which of your playlists the song goes in; with no playlist yet you make one on the spot.',
                        'Add a song by searching YouTube or pasting a YouTube, SoundCloud or Spotify link.',
                        'Drag the tracks into the order they should play in (or use a track\'s menu: move to the top or the bottom), shuffle the order, find a track in the list, rename or delete the list, and download its links as a text file.',
                        'One playlist is your active playlist. Its first track is your next track: the footbar of a room shows it, and it is the one that plays when your turn in the Waitlist comes. When a song has been played it goes to the bottom of its list and slowly moves up as other songs are played, so your next turn plays the next one. The Waitlist tab lists the people in the line, not songs. Chat tells when a song has ended, who joined or left the waitlist and so on, each in its own colour. Pick the active playlist in the footbar or in Playlists.',
                        'Import: paste a YouTube playlist link, a Spotify playlist you own or collaborate on, or several links (one per line). Up to 1,000 songs are imported at a time. Connect your Spotify account first; Spotify tracks are matched to YouTube.',
                        'Inside a room, “Queue” adds one song to the waitlist and “Queue all” adds up to 50 songs of a playlist.',
                    ]}
                />
                <P>Songs always play from YouTube. A SoundCloud or Spotify link is matched to the same song on YouTube, so double-check the result. SoundCloud sets are not supported, and Spotify playlists only work when the site has Spotify credentials.</P>
            </>
        ),
    },
    {
        id: 'voting',
        icon: '👍',
        title: 'Woot, Meh, Grab and XP',
        summary: 'Voting rules, XP and levels.',
        body: (
            <List
                items={[
                    <><b>Woot</b> and <b>Meh</b> replace each other; press the same one again to take it back.</>,
                    <><b>Grab</b> puts the song in one of your playlists, so you can play it later: it asks which one, and lets you make a new playlist (or your first one) right there.</>,
                    'You cannot woot, meh or grab your own song: the others vote on it.',
                    'XP: +2 for chatting (at most once every 10 seconds), +10 when your song has been played, +1 per woot on it, +100 for every friend who registers with your invite link.',
                    'Your level is the square root of your XP divided by 20, rounded down, plus one, and it stops at 100. The Owner, the Developers and the Admins are at level 100. The Community page shows the leaderboards.',
                ]}
            />
        ),
    },
    {
        id: 'chat',
        icon: '💬',
        title: 'Chat and whispers',
        summary: 'Emotes, replies, mentions and private messages.',
        body: (
            <>
                <List
                    items={[
                        'Press Enter to send. Messages are up to 300 characters.',
                        'Under the box: emojis, GIFs (GIPHY), stickers, the room\'s own emojis, BetterTTV emotes, 7TV emotes and a picture button.',
                        'Point at a message for quick Reply and Copy buttons and a ⋯ menu (right-click works too): quick profile, reply, mention, whisper, copy the text or delete it (your own, or any if you moderate).',
                        'Room emojis are written like :name:. BetterTTV and 7TV emotes: click one in the picker, or type its exact name.',
                        'Rest the mouse on a name or picture for a short preview. Click it for the quick profile: level, stats, bio, Whisper, Mention, Add friend, View full profile, and for moderators Mute, Kick and Ban. Messages that mention your name are highlighted.',
                        <>Moderators can clear the chat with <K>🧹 Clear</K> under the box. It clears every message for everyone, announcements and broadcasts too, and nothing comes back when the page is refreshed. The welcome message stays at the top of the chat.</>,
                    ]}
                />
                <H>Whispers</H>
                <P>A whisper is a private message between two people. Open <b>Whispers</b> in the menu, or type <K>/w username message</K> in a room. Only the two of you can read it, and it arrives live.</P>
                <P>System lines in italics tell you who joins and leaves the room, who woots, mehs and grabs a song, and about kicks, bans, mutes, role changes, skips, waitlist changes and announcements. The first line of the chat says which version of SFD.DJ you are on. Settings → Appearance can switch the joins, leaves and votes off.</P>
            </>
        ),
    },
    {
        id: 'roles',
        icon: '👑',
        title: 'Roles and permissions',
        summary: 'Site roles and room roles.',
        body: (
            <>
                <H>Site roles</H>
                <P>From highest to lowest. <b>Staff:</b> 👑 Owner, 🛠️ Developer, 🔴 Admin, 🟣 Lead Moderator, 💗 Brand Ambassador, 🟠 Moderator, 🟢 Site Moderator, 🟡 Helper, 📢 Promoter, 🌐 Translator. <b>Creator / Contributor:</b> 📝 Content Provider, 🎵 Music Producer, 🎤 Artist. <b>Community / Status:</b> 🤝 Partnership, 💜 VIP, 💎 Early Supporter, 🧪 Beta Tester, ⭐ Supporter, 👤 User. You can hold several; the highest is shown first, and the icon of every role you hold shows in front of your name in chat. What each role may do site-wide is set in the Admin panel permission matrix.</P>
                <H>Room roles</H>
                <List
                    items={[
                        'The host can do everything in their room.',
                        'Built-in roles: Co-Host, Manager, Bouncer and Resident DJ. Hosts can also create custom roles with exactly the powers they want.',
                        'Powers: clear chat, remove songs from the waitlist, skip any song, edit room settings, assign room roles, kick and ban users.',
                        'Give a role in Room settings → Roles by searching a name, or from a person\'s quick profile. The person does not have to be in the room.',
                    ]}
                />
            </>
        ),
    },
    {
        id: 'moderation',
        icon: '🛡️',
        title: 'Moderation and AutoMod',
        summary: 'Mute, kick, ban, logs and filters.',
        body: (
            <List
                items={[
                    <><b>Tools:</b> announcements to the room. Clear chat is under the chat box, Skip is in the bar at the bottom of the room.</>,
                    <><b>Mute, kick and ban:</b> from someone's quick profile (click their name) or from the Users tab. Mute lasts 10 minutes, 1 hour, 24 hours or until you undo it.</>,
                    <><b>Banned / Kicked / Muted users:</b> see and undo them in Room moderation.</>,
                    <><b>Moderation logs:</b> the last 100 actions with who did them.</>,
                    <><b>AutoMod:</b> block links, mostly-capital messages, the same message twice within 30 seconds, and your own list of banned words. People who moderate chat are never blocked.</>,
                ]}
            />
        ),
    },
    {
        id: 'social',
        icon: '🤝',
        title: 'Friends, events and profile',
        summary: 'Friends, events, the shop, referrals and your profile.',
        body: (
            <List
                items={[
                    'Friends: your friends with a green dot when they are online and the room they are in, people you may know, and search. Fans are people who woot or grab your songs. Requests holds what you received and sent.',
                    'Events: community happenings with a countdown. Members can create events, press “I\'m going” and use “Add to calendar” to get a reminder in their own calendar app. Event creators and staff can remove events.',
                    'Referral: share your link for +100 XP per friend, and climb the inviter leaderboard.',
                    'Avatar shop: try characters (whole people that stand, dance and DJ), badges (medals from bronze to gold starbursts), accessories (headphones, aviators, ears, a halo, a crown, wings, horns), frames (metal, neon, thorns, frost, hellfire, aurora, prism) and effects (sparkles, notes, sakura, thunder, cosmic dust, a void) on a live preview, then save your whole look in one click. Things cost SFD Coins and open at a level (level 1 things are free): you earn coins by levelling up, playing songs, getting grabs, inviting friends and taking the daily reward, and what you buy is yours for good. Coins are never sold for real money.',
                    'Profile: change your name, pronouns, flag, bio (up to 500 characters, as many lines as you like) and favourite genre, upload a photo and see a live preview. Everybody has a public profile page. Your flag shows next to your name on your profile, in the quick profile card and in the room\'s user list.',
                    'Status: Online, Busy, Away or Offline, from the menu under your picture or in Profile. It is the dot next to your picture in the menu, in rooms and on your profile. Busy means do not disturb: no pop-ups for whispers and friend requests. Offline makes you look offline to everybody, and you can still use the site.',
                    'Special badges: Beta Tester, Founding Member, Bug Hunter, Contributor, Event Champion, Tastemaker and Community Hero are given by SFD.DJ staff (admin panel, Users tab) to people who earned them. They show in front of your name, and with what each one means on your profile.',
                    'Everything you change shows at once: buy something in the Avatar shop (it opens inside the room) and put it on, change your status or your flag, and you and everybody in the room see it without a refresh.',
                    'Privacy: choose who may whisper you, whether people may send friend requests and whether your online status is shown.',
                    'My Stuff: your numbers, achievements, rooms, playlists, recent songs and equipped items on one page.',
                ]}
            />
        ),
    },
    {
        id: 'developers',
        icon: '🤖',
        title: 'Developers: API, bots and extensions',
        summary: 'Tokens, endpoints and the npm package.',
        body: (
            <>
                <P>SFD.DJ has a public JSON API. Use it to build room bots, browser extensions and tools. Everything passes the same permission checks as the website, so a bot can only do what its room role allows.</P>
                <H>1. Get a token</H>
                <List
                    items={[
                        <>Open <b>Settings → Developers</b>. <b>Create bot</b> makes a separate 🤖 account with its own token. <b>New token</b> under “My personal tokens” makes one that acts as you (good for your own extension).</>,
                        'The token is shown once. Keep it secret like a password; delete it on the same page if it leaks.',
                        'To let a bot moderate or manage the queue, give it a room role in Room settings → Roles. Without a role it can read and chat, nothing more.',
                    ]}
                />
                <H>2. Call the API</H>
                <P>Base address: <K>{`${origin()}/api/v1`}</K>. Send <K>Authorization: Bearer YOUR_TOKEN</K> and <K>Accept: application/json</K>. A room is addressed by its slug (the last part of its web address). Posting a chat message makes a bot visible in the room automatically; for a quiet bot, heartbeat every 30 seconds and leave when it disconnects. Limits: 120 requests a minute per token, chat 60, whispers 30.</P>
                <Code>{`curl ${origin()}/api/v1/rooms/my-room/messages \\
  -H "Authorization: Bearer YOUR_TOKEN" -H "Accept: application/json"

curl -X POST ${origin()}/api/v1/rooms/my-room/messages \\
  -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \\
  -d '{"body":"Hello from a bot"}'`}</Code>
                <H>3. Endpoints</H>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-xs">
                        <tbody className="divide-y divide-white/5">
                            {[
                                ['GET', '/me', 'The account behind the token'],
                                ['GET', '/users/{id}', 'A public profile'],
                                ['GET', '/rooms', 'Rooms you may see, with listeners and queue length'],
                                ['GET', '/rooms/{room}', 'Settings, what is playing, waitlist, votes, your permissions'],
                                ['GET', '/rooms/{room}/members', 'Room roles and who holds them'],
                                ['POST', '/rooms/{room}/presence', 'Join or refresh a bot presence lease (expires after 90 seconds)'],
                                ['DELETE', '/rooms/{room}/presence', 'Leave the visual room'],
                                ['GET', '/rooms/{room}/messages?after=ID&limit=50', 'Chat history; after= returns only newer messages'],
                                ['POST', '/rooms/{room}/messages', 'body, optional reply_to_id'],
                                ['DELETE', '/rooms/{room}/messages/{id}', 'Delete a message (yours, or any with chat moderation)'],
                                ['DELETE', '/rooms/{room}/messages', 'Clear the chat (every message goes)'],
                                ['POST', '/rooms/{room}/announce', 'message: a highlighted room announcement'],
                                ['POST', '/rooms/{room}/queue', 'url, or video_id: add a song to the waitlist'],
                                ['DELETE', '/rooms/{room}/queue/{item}', 'Remove a song from the waitlist'],
                                ['DELETE', '/rooms/{room}/waitlist', 'Leave the waitlist'],
                                ['PATCH', '/rooms/{room}/waitlist-settings', 'locked and/or cycle (true / false)'],
                                ['POST', '/rooms/{room}/skip', 'item_id of the playing song'],
                                ['POST', '/rooms/{room}/vote', 'type: woot, meh or grab (not on your own song). A grab needs playlist_id (one of your playlists) or new_playlist (a name)'],
                                ['GET', '/youtube/search?q=', 'Search songs'],
                                ['POST', '/rooms/{room}/kick/{user}', 'Kick'],
                                ['POST / DELETE', '/rooms/{room}/ban/{user}', 'Ban / unban'],
                                ['POST / DELETE', '/rooms/{room}/mute/{user}', 'Mute (for: 10m, 1h, 24h, forever) / unmute'],
                                ['PUT', '/rooms/{room}/members/{user}', 'room_role_id (or null): give or remove a room role'],
                                ['GET', '/whispers, /whispers/{user}', 'Whisper conversations and one thread'],
                                ['POST', '/whispers', 'user_id or username, and body'],
                            ].map(([method, path, what]) => (
                                <tr key={method + path}>
                                    <td className="whitespace-nowrap px-3 py-2 font-mono text-violet-300">{method}</td>
                                    <td className="whitespace-nowrap px-3 py-2 font-mono text-neutral-200">{path}</td>
                                    <td className="px-3 py-2 text-neutral-400">{what}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <P>Success is a JSON body or an empty <K>204</K>. Errors: <K>401</K> bad or missing token, <K>403</K> not allowed (or banned from the room), <K>422</K> invalid input with an <K>errors</K> object, <K>429</K> slow down.</P>
                <H>4. The JavaScript library</H>
                <P>Prefer a ready-made client? <K>npm install sfddj</K> wraps every endpoint and has a small <K>Bot</K> helper with chat commands and a song-change event.</P>
                <Code>{`import { SfdDj } from 'sfddj';

const sfd = new SfdDj({ token: process.env.SFDDJ_TOKEN, baseUrl: '${origin()}' });
const bot = sfd.bot('my-room-slug').command('ping', () => bot.say('pong!'));
await bot.start();`}</Code>
                <Note tone="warn">Never put a token in a public repository or in a browser extension you share. Anyone who has it can act as that account.</Note>
            </>
        ),
    },
    {
        id: 'security',
        icon: '🔐',
        title: 'Account and security',
        summary: 'Passwords, two-factor, and saved accounts.',
        body: (
            <>
                <List
                    items={[
                        'Confirm your email once; the site asks again only if you change it. If the message does not come you can press Send again, and staff can confirm you by hand.',
                        'Turn on two-factor login in Settings → Account with any authenticator app and keep the recovery codes safe.',
                        'Settings → Account & security also lists the devices you are logged in on (log them out one by one or all at once) and lets you download all your data.',
                        'The eye icon in password fields shows what you typed.',
                        'Forgot your password? Use the link on the login page. Passwords are never stored in a readable form and never sent to you.',
                        'Staff can warn you; warnings are listed under Settings → Violations.',
                    ]}
                />
                <Note>“Accounts on this device” on the login page keeps your details encrypted in your own browser only. Do not tick it on a shared computer.</Note>
            </>
        ),
    },
];

export default function Docs() {
    const [q, setQ] = useState('');
    const [active, setActive] = useState(sections[0].id);
    const refs = useRef<Record<string, HTMLElement | null>>({});
    const [hits, setHits] = useState<Set<string> | null>(null); // null = no search

    // search: look in the text of every rendered section
    useEffect(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return setHits(null);
        setHits(new Set(sections.filter((s) => (refs.current[s.id]?.textContent ?? '').toLowerCase().includes(needle) || s.title.toLowerCase().includes(needle)).map((s) => s.id)));
    }, [q]);

    // the table of contents follows the section that is on screen
    useEffect(() => {
        const root = document.querySelector('main');
        const seen = new IntersectionObserver((entries) => {
            const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            if (top) setActive(top.target.id);
        }, { root, rootMargin: '-10% 0px -75% 0px' });
        Object.values(refs.current).forEach((el) => el && seen.observe(el));

        return () => seen.disconnect();
    }, [hits]);

    const visible = useMemo(() => sections.filter((s) => !hits || hits.has(s.id)), [hits]);

    return (
        <AppLayout title="Docs" subtitle={<>How SFD.DJ works. Short answers live in the <Link href={route('faq')} className="text-violet-400 hover:underline">FAQ</Link>.</>}>
            <Head title="Docs" />

            <div className="relative max-w-xl">
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the docs…" className={`${fieldClass} py-3 pl-11 text-base`} />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_1fr]">
                <nav className="hidden lg:block">
                    <ul className="sticky top-4 space-y-1 text-sm">
                        <li className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">On this page</li>
                        {sections.map((s) => (
                            <li key={s.id} className={hits && !hits.has(s.id) ? 'opacity-30' : ''}>
                                <a href={`#${s.id}`} className={`block rounded-lg px-3 py-1.5 transition ${active === s.id ? 'bg-violet-600/25 font-semibold text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}>{s.icon} {s.title}</a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="min-w-0 space-y-6">
                    {hits && <p className="text-sm text-neutral-400">{visible.length} {visible.length === 1 ? 'section matches' : 'sections match'} “{q.trim()}”</p>}
                    {hits && visible.length === 0 && <EmptyState icon="🔍" title="Nothing found" text="Try other words, or look in the FAQ." action={<Link href={route('faq')} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">Open the FAQ</Link>} />}

                    {/* every section stays mounted (hidden when it does not match) so its text can be searched */}
                    {sections.map((s) => (
                        <section key={s.id} id={s.id} ref={(el) => { refs.current[s.id] = el; }} className={`scroll-mt-4 ${hits && !hits.has(s.id) ? 'hidden' : ''}`}>
                            <Card className="space-y-3 p-6">
                                <div>
                                    <h2 className="text-xl font-bold">{s.icon} {s.title}</h2>
                                    <p className="text-sm text-neutral-500">{s.summary}</p>
                                </div>
                                {s.body}
                            </Card>
                        </section>
                    ))}
                    <p className="text-xs text-neutral-600">Tip: type <K>:name:</K> for room emojis.</p>
                </div>
            </div>
        </AppLayout>
    );
}
