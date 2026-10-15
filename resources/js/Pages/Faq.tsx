import { Card, EmptyState, fieldClass } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { ChevronDown, LifeBuoy, Search } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';

interface Item {
    q: string;
    a: string;
    link?: [string, string]; // label, route name
}

const faq: { group: string; icon: string; items: Item[] }[] = [
    {
        group: 'Getting started',
        icon: '🚀',
        items: [
            { q: 'What is SFD-DJ.EU?', a: 'A place to listen to music together. You join a room, a DJ plays a song, and everyone in the room hears it at the same second while chatting about it.' },
            { q: 'Is it free?', a: 'Yes. Rooms, chat, playlists, the avatar shop and the API cost nothing, and they stay free. Plus and Premium are optional paid plans for a gem next to your name, more XP and room for more playlists and emojis.', link: ['See pricing', 'site.pricing'] },
            { q: 'Do I need an account?', a: 'Not to look around. As a guest you can open rooms, watch what is playing and read the chat. To chat, vote, build playlists or DJ you need a free account with a verified email address.' },
            { q: 'I did not get the confirm email. What now?', a: 'Look in your Spam or Junk folder, then press "Send the email again" on the confirm page (or on the bar at the top of the site). It works for an hour. If the site cannot send email yet (the owner has not set up a mail server), nothing can arrive and you do not need it: press "Continue to SFD-DJ.EU", everything works. If it still does not come, ask SFD-DJ.EU staff in the chat bubble: they can confirm your email by hand.' },
            { q: 'Do I have to confirm my email?', a: 'Only when the site can send email and staff have it switched on. Then you confirm before you chat, vote and DJ. Whenever email is not working (or staff left it optional), you get in at once and a bar at the top invites you to confirm later. Confirming is also how you get back in if you forget your password.' },
            { q: 'How do I become a DJ?', a: 'Make a playlist first (Playlists in the menu on the left). Then open a room and press Join Waitlist, the blue card to the left of the DJ booth: it puts you in the line (the Waitlist tab lists the people waiting, not songs). When it is your turn the top track of your active playlist, the one the footbar shows under Next track, plays for the whole room, and afterwards it goes to the bottom of your list. The card turns orange and says Leave Waitlist: press it to leave the line. Its second line is how long it is until your turn.' },
            { q: 'What is the active playlist?', a: 'The playlist you play from. Its first track is your next track. Change it in the footbar of a room (Active playlist) or in Playlists with Set as active. Drag the tracks of a playlist to change what plays first.' },
            { q: 'I forgot my password.', a: 'Press "Forgot your password?" on the login page. You get an email with a link to choose a new one. Nobody, not even the staff, can see or send you your old password: only a scrambled version is stored.' },
            { q: 'Can I log in with my username?', a: 'Yes. The login box takes either your email address or your username.' },
            { q: 'What is "Accounts on this device" on the login page?', a: 'An optional shortcut. If you tick "Save this account on this device", your details are kept encrypted inside your own browser only, never sent to the site. Do not use it on a shared computer.' },
        ],
    },
    {
        group: 'Music',
        icon: '🎵',
        items: [
            { q: 'Which services can I add songs from?', a: 'YouTube (links and search), SoundCloud and Spotify (links). Everything is played through YouTube, so a SoundCloud or Spotify track is matched to the same song on YouTube. Check the result: the match can be a different version.' },
            { q: 'How do I import a private YouTube or Spotify playlist?', a: 'Connect the relevant account in Settings → Connections. YouTube imports work for playlists that connected channel can access. Spotify imports require the connected account to own or collaborate on the playlist; public visibility alone may not be enough. SoundCloud sets and Spotify albums are not supported.' },
            { q: 'What do Woot, Meh and Grab do?', a: 'Woot says you like the song, Meh says you do not. Grab puts the song in one of your playlists so you can play it later: it asks which one, and if you have no playlist yet it lets you make one first. Every woot gives the DJ +1 XP.' },
            { q: 'Why can I not woot, meh or grab my own song?', a: 'To keep the votes honest. While your song plays, the others vote on it.' },
            { q: 'What does the lock on the waitlist mean?', a: 'A room moderator locked it. Until it is unlocked only people who manage the queue can add songs.' },
            { q: 'What is cycling?', a: 'With cycling on, a song that has been played goes to the back of the waitlist, so the music keeps going round.' },
            { q: 'I refreshed the page. Will the music stop?', a: 'No. The room reconnects and plays from the right second. Some browsers keep the sound off until you click: the video then plays muted, and the first click anywhere on the page turns the sound on.' },
            { q: 'Does my volume stay?', a: 'Yes. The volume you set is remembered in this browser, also after a refresh.' },
            { q: 'A song says it cannot be played.', a: 'The owner of the video blocked playing it on other sites, or removed it. Skip it and pick another version.' },
        ],
    },
    {
        group: 'Chat and whispers',
        icon: '💬',
        items: [
            { q: 'Can I send GIFs, pictures and emotes?', a: 'Yes. Under the chat box you find emojis, GIFs, stickers, the room\'s own emojis, BetterTTV and 7TV emotes, and a button for pictures. Press Enter to send. Messages are up to 300 characters.' },
            { q: 'What are the lines like “Kati wooted this song” in the chat?', a: 'System lines: they tell you who joins and leaves the room and who woots, mehs or grabs the song that is playing. They are not saved, so they are gone when you refresh. If a room is too busy for them, turn them off in Settings → Appearance. The first line of the chat says which version of SFD-DJ.EU you are on, with a link to what is new.', link: ['Open appearance settings', 'settings.appearance'] },
            { q: 'What happens when I press Grab?', a: 'A window asks which of your playlists the song goes in. If you have none, it asks you to make one first (type a name, and the song goes right into it). You find the song in that playlist afterwards. Grabbing the same song again does not add it twice to the same playlist, and it counts once for the DJ.' },
            { q: 'Why was my message blocked?', a: 'The room has AutoMod switched on. It can block links, shouting in capital letters, repeated messages and words the room does not allow. The message tells you which one it was.' },
            { q: 'Why can I not post a link?', a: 'SFD-DJ.EU does not let anybody share other sites: not in the chat, not in whispers, not in a bio or the texts of a room. Links to SFD-DJ.EU itself and to our partners club.dj, borealise.com (app.borealise.com too) and cord.dj are fine. Addresses are found with or without https:// and www., also written as "name . dj" or "name(dot)dj", and other music sites are refused by their name as well. SFD-DJ.EU staff are not stopped.' },
            { q: 'Why can I not write in a room?', a: 'You are probably muted there. A mute ends by itself after the time the moderator chose, or when they unmute you.' },
            { q: 'How do I mention someone, or see who they are?', a: 'Rest the mouse on their name or picture in chat for a short preview, or click it for the quick profile with their level and stats, Whisper, Mention, Add friend and View full profile. You can also point at a message and open ⋯ (or right-click it) to reply, mention or whisper. Messages that mention your name are highlighted.' },
            { q: 'What is a whisper?', a: 'A private message between two people. Open Whispers in the menu, or type /w username message in a room\'s chat. Only the two of you can read it.', link: ['Open whispers', 'whispers'] },
            { q: 'Who can clear the chat?', a: 'Moderators and anyone with the chat moderation permission, with 🧹 Clear under the chat box. It clears every message for everyone, and nothing comes back when the page is refreshed. The welcome message stays at the top.' },
        ],
    },
    {
        group: 'Rooms and roles',
        icon: '🏠',
        items: [
            { q: 'What is a private room?', a: 'Only the host and SFD-DJ.EU staff can enter it. It does not show up in room lists for anyone else.' },
            { q: 'How do I get a role in a room?', a: 'The host (or a Co-Host) can give you one in Room settings → Roles. Roles like Bouncer or Resident DJ come with powers such as skipping songs or kicking people.' },
            { q: 'What is the difference between Owner and Host?', a: 'Host is a role inside one room (the person who created it). Owner is a role for the whole site and ranks above everything else.' },
            { q: 'Where is everybody in the room?', a: 'On the floor above the DJ booth, which is at the bottom of the room. They stand there until they press Woot or Grab, and then they dance. Click a person to open their quick profile; you are the one with the “You” tag. The DJ is the one standing at the decks, with their back to you. If a room is very full, the last few people show as a +number.' },
            { q: 'Can the host change how the room looks?', a: 'Yes: Room settings → General → Background. There are six colour schemes for the club (Default, Midnight, Sunset, Neon, Forest and Club); anyone who can change the room settings can pick one. The host also has custom backgrounds that nobody else sees or can pick, the Halloween and Christmas ones in a group of their own called Special: Halloween (a haunted house, a graveyard, a full moon, bats and pumpkins), Halloween V2 (a witch\'s lair with a bubbling cauldron, floating candles, a cabinet of potions and a witch flying across a green moon), Christmas (northern lights, Santa\'s sleigh across the moon, a big tree, a log cabin and falling snow), Christmas V2 (Christmas Eve inside a warm lodge: the video in a gold frame over a crackling fireplace with stockings and candles, a big tree, a snowy window with Santa\'s sleigh across the moon, a toy train and gold glitter in the air), Winter (a snowy sunset with a gondola, an igloo and a fox), Spring (a rainbow, a balloon, a windmill and cherry blossom), Easter (a garden with an egg tree, a giant painted egg, bunnies, chicks and a basket of eggs), Summer (a beach with palms, a sailboat and a crab), Midsummer (Jaanipäev: a bonfire by a lake on the white night, birches, the village swing and wild flowers), Synthwave (a neon outrun night with a striped sun) Retrowave (an 80s waterfront with a skyline, a boombox and an arcade machine), Midnight Definity (a midnight sky with an infinity sign), Anime (a rooftop evening with fireworks, a train and a cat), LATAM (colourful houses, paper flags, a piñata and a llama) Lightshow (a dark club full of beams and lasers), Cat café (a cosy room full of cats), Gold Mine (a timbered mine with veins of gold, a door into the rock, a cart of gold on rails and a chest running over with coins), Skull (a giant skull with burning eyes and the video in its forehead), Skulls (a candlelit catacomb stacked with skulls), Ultra Music Festival (a festival main stage with LED wings, jets of fire and a crowd with its arms in the air), Foxy (an autumn forest at dusk with foxes, a den, pumpkins and falling leaves), Dragon (a long red and gold dragon coiling round the video, under storm clouds and peaks), Tastycat (a pastel bakery for cats with a cabinet of cupcakes, a three-tier cake, a chef cat and falling sprinkles), Tasty (a night food market with a burger stall, a noodle stall, a marquee frame and a pizza under the booth) and Monstercat (a neon arena with two huge monster cats on either side of the video). The host can also upload a picture of their own: Room settings → Background → Upload your own picture.' },
            { q: 'Why did my room turn into Halloween (or Christmas)?', a: 'In their season every room shows the Halloween or the Christmas background by itself: Halloween in October, Christmas from 1 December to 6 January. The host can pick the other one of the season (Halloween V2, Christmas V2) in Room settings → Background → Special, or any other background to switch it off in the room. When the season is over the room shows its own background again.' },
            { q: 'What are the badges next to names?', a: 'Icons for the roles someone holds (each in the colour of the role: point at one for its name), then the special badges SFD-DJ.EU staff gave them (Beta Tester, Bug Hunter and so on), then their level, then a badge they chose in the Avatar shop. Bots have a robot. Everybody who signs up while SFD-DJ.EU is in beta gets the Beta Tester role.' },
            { q: 'Can the moderation log be deleted?', a: 'Yes, by the host of the room and SFD-DJ.EU staff: Room moderation → Moderation logs, a bin on each line or Clear all logs. Moderators cannot delete it, since it is how their own actions are checked.' },
            { q: 'What are the special badges?', a: 'Badges you cannot buy: SFD-DJ.EU staff give them to people who earned them. Beta Tester (tried the site before it opened), Founding Member, Bug Hunter, Contributor, Event Champion, Tastemaker and Community Hero. They show in front of a name, and on the profile with what each one means. Staff hand them out in the admin panel, Users tab.' },
            { q: 'What are the room rules window and “Do not show again”?', a: 'A room can have rules: up to ten, each with a title and a few words. When you come into such a room you read them and press “I agree”. “Do not show again in this room” keeps the window away on this device, until the host changes the rules. The host writes them in Room settings → Rules.' },
            { q: 'Can I make my own room look different with CSS?', a: 'Yes, if you are the host: Room settings → Room CSS. Style the parts of the room with the classes the editor lists (.sfd-chat, .sfd-navbar, .sfd-footbar and so on) and everybody in the room gets it the moment you save. Only harmless CSS is kept (no @import, no scripts, no fixed overlays); the editor shows what was left out.' },
            { q: 'What do Official, Verified and Partnered rooms mean?', a: 'Badges that SFD-DJ.EU staff give to rooms. Official is for rooms run by the SFD-DJ.EU team, Verified for rooms we checked and trust, Partnered for rooms that work together with us. A room can have one, two or all three, and they show next to its name. Write to us through Contact if you think your room qualifies.', link: ['Contact us', 'site.contact'] },
            { q: 'I was kicked or banned. What now?', a: 'A kick only sends you out; you can come back. A ban keeps you out of that room until a moderator lifts it. Ask the host or a moderator politely; every action is in the room\'s moderation log.' },
        ],
    },
    {
        group: 'Friends, events and community',
        icon: '🎉',
        items: [
            { q: 'How do I add friends?', a: 'Click someone\'s name in a room and press Add friend, or use the Friends page: it suggests people you may know and lets you add by username. When they accept you see when they are online and which room they are in.', link: ['Open friends', 'friends'] },
            { q: 'How do I add an event to my calendar?', a: 'Open Events and press "Add to calendar". You get a file that Google Calendar, Outlook and Apple Calendar can open.', link: ['Open events', 'events'] },
            { q: 'How do referrals work?', a: 'Share your invite link. For every friend who registers with it you get 100 XP, with no limit.', link: ['Get my link', 'referral'] },
            { q: 'How do levels and XP work?', a: 'You earn XP by chatting (+2, at most once every 10 seconds), having your songs played (+10, plus +1 per woot) and inviting friends (+100). Levels grow with the square root of your XP, from level 1 up to level 100 (the Owner, the Developers and the Admins are at level 100).' },
        ],
    },
    {
        group: 'Account',
        icon: '👤',
        items: [
            { q: 'What are Plus and Premium?', a: 'Optional paid plans; everything that is free stays free. Plus (€2.99 a month or €29.99 a year) gives a teal gem next to your name, +25% XP, 60 playlists with up to 1,000 songs each and 50 emojis in the rooms you host. Premium (€5.99 a month or €59.99 a year) gives a gold gem, +50% XP, 100 playlists with up to 2,000 songs and 100 room emojis. Buy, change or cancel one in Settings → Plus; payments go through Stripe, and after cancelling you keep the plan until the end of the time you paid for.', link: ['See the prices', 'site.pricing'] },
            { q: 'What is the difference between username and display name?', a: 'Your username is unique: it is for logging in and for being found. Your display name is what people see in chat and can be anything. Change both in Profile.' },
            { q: 'How do I change my profile picture?', a: 'Profile → Upload photo. Still pictures are cropped to a square; an animated GIF or WebP keeps moving. Picking an avatar in the Avatar shop replaces the photo.' },
            { q: 'Can I have an avatar that moves?', a: 'Yes, two ways. The Avatar shop has characters: whole people (Foxy, Neko, Bun, Panda, Wolfie, Robo) that stand in the room until you press Woot or Grab and then dance, and DJ on the stage. They unlock as you level up. Or upload your own animated GIF or WebP as your photo in Profile: up to 1 MB and 1024 pixels, and it keeps moving.' },
            { q: 'Why does nothing move?', a: 'Your computer is probably set to reduce motion (on Windows: Settings → Accessibility → Visual effects → Animation effects), and then the site keeps still. You can turn that on, or switch on Always play animations in Settings → Appearance and the dancing and the avatars move anyway. A character still shows its pose: standing, dancing or DJing.', link: ['Open appearance settings', 'settings.appearance'] },
            { q: 'Why can I not see some characters in the Avatar shop?', a: 'A few characters are made for people who hold a site role: the astronauts, Fedora, Blaze and Echo are for Brand Ambassadors and everybody above them (Lead Moderator, Admin, Developer, Owner). The shop shows them only to those people, and everybody else sees them on the dance floor. If you lose the role, an avatar made for it is taken off.' },
            { q: 'What is a character?', a: 'A whole person instead of a round picture. In a room it stands on the floor until you press Woot or Grab, then it dances, and when it is your song it DJs at the decks, seen from behind. Everywhere else (chat, lists, your profile) you see its face. Pick one in the Avatar shop with the Characters filter. Everybody has one: a new account starts as a free character straight away (there is no plain letter avatar any more), and you can buy others in the Avatar shop or upload a photo instead.', link: ['Open the Avatar shop', 'shop'] },
            { q: 'How do I get more things in the Avatar shop?', a: 'Level up and save SFD Coins. Every item opens at a level and costs coins: the higher the level, the more it costs, and a character costs a little more than a badge. Level 1 things are free. You can try any item on before you buy it, and what you buy is yours for good.', link: ['Open the Avatar shop', 'shop'] },
            { q: 'What are SFD Coins?', a: 'The money of the Avatar shop, earned by playing and never sold for real money. A new level pays 10 coins times the level, a song of yours that is played pays 5 (and 1 more for every 2 woots), a grab of your song pays 2, a friend who joins with your link pays 50 and the daily reward pays 25 once a day (on the dashboard and in the shop). Your coins show next to Avatar shop in the menu, and only you can see them.' },
            { q: 'Can I use two-factor login?', a: 'Yes. Open Settings → Account and set up an authenticator app. Save your recovery codes somewhere safe.' },
            { q: 'Can I link Discord, Spotify or YouTube?', a: 'Yes, in Settings → Connections when each service is configured. We use the connections only for the features shown there; OAuth tokens stay private. Your Discord name and connected YouTube channel may appear on your profile.' },
            { q: 'Can I stop people from whispering me or adding me?', a: 'Yes. Settings → Privacy lets you allow whispers from everyone, only friends or nobody, switch friend requests off, and hide your online status. SFD-DJ.EU staff can always reach you.', link: ['Open privacy settings', 'settings.privacy'] },
            { q: 'How do I see where I am logged in?', a: 'Settings → Account & security lists every browser and device. You can log one out, or all the others at once (it asks for your password).', link: ['Open account settings', 'settings.account'] },
            { q: 'Can I download my data?', a: 'Yes. Settings → Account & security → Download my data gives you one file with your profile, settings, friends, playlists, rooms, whispers and violations. It never contains your password or tokens.', link: ['Open account settings', 'settings.account'] },
            { q: 'Where do I write my bio?', a: 'In Settings → Profile: up to 500 characters and as many lines as you like, shown on your profile and in your quick profile card. You can also pick a favourite genre: we use it to suggest rooms. A preview card shows how others will see you.', link: ['Edit my profile', 'profile.edit'] },
            { q: 'How do I show my flag and my pronouns?', a: 'In Settings → Profile: pick your country (the flag shows next to your name on your profile, in the quick profile card and in the room\'s user list) and write your pronouns, or pick one of the suggestions. Both are optional, and you can take them away again.', link: ['Edit my profile', 'profile.edit'] },
            { q: 'What do the status dots mean?', a: 'Green is online, red is busy (do not disturb: no pop-ups for whispers and friend requests), amber is away and grey is offline. Change yours from the menu under your picture or in Profile. Offline makes you look offline to everybody, while you can still use SFD-DJ.EU.' },
            { q: 'Who can see my email address?', a: 'Nobody but you. It is never shown to other users.' },
            { q: 'How do I delete my account?', a: 'Profile, at the bottom: Delete account. It removes your account and what belongs to it.' },
        ],
    },
    {
        group: 'Developers',
        icon: '🤖',
        items: [
            { q: 'Can I build a bot or a browser extension?', a: 'Yes. Make a bot or a token in Settings → Developers and call the API, or install the npm package "sfddj". A bot can only do what its room role allows.', link: ['For developers', 'site.developers'] },
            { q: 'Are there limits?', a: '120 requests a minute per token, chat 60 a minute, whispers 30 a minute. Do not use the API to spam or to get around bans.' },
        ],
    },
];

/** Wrap the search words in a highlight. */
function mark(text: string, needle: string): ReactNode {
    if (!needle) return text;
    const parts = text.split(new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'));

    return parts.map((p, i) => (p.toLowerCase() === needle.toLowerCase() ? <mark key={i} className="rounded bg-violet-500/40 px-0.5 text-white">{p}</mark> : p));
}

export default function Faq() {
    const [q, setQ] = useState('');
    const [open, setOpen] = useState<Set<string>>(new Set());
    const [group, setGroup] = useState<string | null>(null);
    const needle = q.trim();

    const groups = useMemo(() => faq
        .map((g) => ({ ...g, items: g.items.filter((i) => !needle || `${i.q} ${i.a}`.toLowerCase().includes(needle.toLowerCase())) }))
        .filter((g) => g.items.length > 0 && (!group || g.group === group)), [needle, group]);
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    const all = faq.reduce((n, g) => n + g.items.length, 0);

    const toggle = (key: string) => setOpen((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
    const isOpen = (key: string) => open.has(key) || !!needle; // a search shows the answers straight away

    return (
        <AppLayout title="FAQ" subtitle={<>Quick answers to {all} common questions. Looking for more detail? Read the <Link href={route('docs')} className="text-violet-400 hover:underline">Docs</Link>.</>}>
            <Head title="FAQ" />

            <div className="relative max-w-xl">
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the questions…" className={`${fieldClass} py-3 pl-11 text-base`} />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_1fr]">
                <nav className="lg:sticky lg:top-4 lg:self-start">
                    <ul className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
                        <li><button onClick={() => setGroup(null)} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${group === null ? 'bg-violet-600/25 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}>All questions <span className="text-xs text-neutral-500">{all}</span></button></li>
                        {faq.map((g) => (
                            <li key={g.group}>
                                <button onClick={() => setGroup(group === g.group ? null : g.group)} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${group === g.group ? 'bg-violet-600/25 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}>{g.icon} {g.group}</button>
                            </li>
                        ))}
                    </ul>
                    {total > 0 && (
                        <button onClick={() => setOpen(open.size ? new Set() : new Set(groups.flatMap((g) => g.items.map((i) => i.q))))} className="mt-4 hidden text-xs text-violet-400 hover:underline lg:block">{open.size ? 'Collapse all' : 'Expand all'}</button>
                    )}
                </nav>

                <div className="space-y-8">
                    {needle && <p className="text-sm text-neutral-400">{total} {total === 1 ? 'answer' : 'answers'} for “{needle}”</p>}
                    {total === 0 && <EmptyState icon="🔍" title="Nothing found" text="Try other words, or ask us directly." action={<Link href={route('site.contact')} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">Contact us</Link>} />}

                    {groups.map((g) => (
                        <section key={g.group}>
                            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-300">{g.icon} {g.group}</h2>
                            <Card className="divide-y divide-white/5">
                                {g.items.map((i) => (
                                    <div key={i.q}>
                                        <button onClick={() => toggle(i.q)} aria-expanded={isOpen(i.q)} className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-semibold hover:bg-white/3">
                                            <span>{mark(i.q, needle)}</span>
                                            <ChevronDown size={18} className={`shrink-0 text-neutral-500 transition ${isOpen(i.q) ? 'rotate-180 text-violet-300' : ''}`} />
                                        </button>
                                        {isOpen(i.q) && (
                                            <div className="px-4 pb-4 text-sm leading-relaxed text-neutral-300">
                                                <p>{mark(i.a, needle)}</p>
                                                {i.link && <Link href={route(i.link[1])} className="mt-2 inline-block font-semibold text-violet-400 hover:underline">{i.link[0]} →</Link>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </Card>
                        </section>
                    ))}

                    <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
                        <div className="flex items-center gap-4">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300"><LifeBuoy size={22} /></span>
                            <div><p className="font-semibold">Still stuck?</p><p className="text-sm text-neutral-400">Talk to us in the live chat. No account needed.</p></div>
                        </div>
                        <Link href={route('site.contact')} className="rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-semibold hover:opacity-90">Contact support</Link>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
