/** Words for the public website (home, features, about, legal). Plain data, so a page needs no code to change. */

export interface Feature {
    slug: string;
    icon: string;
    title: string;
    tagline: string;
    intro: string;
    points: [string, string][];
    steps?: string[];
    related: string[];
}

export const features: Feature[] = [
    {
        slug: 'rooms',
        icon: '🎧',
        title: 'Rooms & the waitlist',
        tagline: 'One song, one moment, everybody together.',
        intro: 'A room is a place with its own chat, its own crowd and one song that plays for everyone at the same second. Join the waitlist and your songs take turns with everyone else\'s.',
        points: [
            ['Perfect sync', 'A late joiner starts exactly where the song is now, not at the beginning. Refresh the page and the music carries on.'],
            ['A fair waitlist', 'First song in plays first. You may skip your own song; skipping others needs the Skip permission.'],
            ['Lock and cycle', 'Hosts can lock the waitlist to the people they trust, or turn cycling on so played songs go to the back of the line.'],
            ['Genres and private rooms', 'Give a room a genre so people can find it. Make it private and only you and SFD-DJ.EU staff can enter.'],
            ['Woot, Meh, Grab', 'Woot a song you love, Meh one you do not. Grab puts it in the playlist you pick. Nobody votes for their own song.'],
            ['Watch as a guest', 'Anyone can open a public room, watch and read the chat without an account.'],
        ],
        steps: ['Open the dashboard and pick a room, or create your own with a name, a genre and a description.', 'The music starts by itself. If your browser keeps it quiet, click anywhere on the page once.', 'Add a song to the waitlist and wait for your turn.'],
        related: ['music', 'chat', 'roles'],
    },
    {
        slug: 'music',
        icon: '🎵',
        title: 'Music & playlists',
        tagline: 'Bring your songs from anywhere.',
        intro: 'Build playlists once and queue them in any room. Add songs by searching, or paste a link.',
        points: [
            ['YouTube, SoundCloud, Spotify', 'Paste a link from any of them. YouTube songs play from YouTube and SoundCloud tracks from SoundCloud; Spotify tracks are matched to the same song on YouTube.'],
            ['Import in bulk', 'Paste a YouTube playlist or a list of links and import up to 1,000 songs at a time.'],
            ['Your order', 'Drag the tracks of a playlist into the order they should play in. The first one is your next track, and Join Waitlist queues it.'],
            ['Queue all', 'Put a whole playlist (up to 50 songs) into the waitlist with one button, from inside the room.'],
            ['Grabs', 'Press Grab on any song, pick the playlist it goes in, and it is ready to be queued again.'],
            ['History', 'Every song that has been played is listed with who played it and where.'],
            ['XP for good taste', 'When your song is played you earn XP, and one more for every woot it gets.'],
        ],
        related: ['rooms', 'avatars'],
    },
    {
        slug: 'chat',
        icon: '💬',
        title: 'Chat & emotes',
        tagline: 'Talk about the track while it plays.',
        intro: 'Live chat with all the things you expect, plus a quick profile on every name.',
        points: [
            ['GIFs, stickers, pictures', 'Search GIPHY GIFs, send a big sticker, or add a picture from your device.'],
            ['BetterTTV and 7TV', 'Use the emotes you know. Pick them from the BTTV and 7TV tabs, or type the name.'],
            ['Room emojis', 'Hosts can add their own custom emojis, used like :name:.'],
            ['Replies and mentions', 'Reply to a message, or @mention someone. Messages that mention you are highlighted.'],
            ['Quick profile', 'Rest the mouse on a name for a preview, or click it to see their level and stats, whisper, mention, add them as a friend, and (for moderators) mute, kick or ban. Right-click a message for reply, copy and more.'],
            ['Whispers', 'Private messages between two people, live, also with /w name message right in chat.'],
        ],
        related: ['moderation', 'rooms'],
    },
    {
        slug: 'moderation',
        icon: '🛡️',
        title: 'Moderation & AutoMod',
        tagline: 'Keep the room the way you want it.',
        intro: 'Everything a host or moderator needs to keep a room friendly, with a log of every action.',
        points: [
            ['Kick, mute, ban', 'Mute for 10 minutes, an hour, a day or until you undo it. Kick to send someone out. Ban to keep them out.'],
            ['AutoMod filters', 'Block links, shouting, the same message twice, and your own list of banned words. Moderators are never blocked.'],
            ['Moderation logs', 'The last 100 actions with who did them, so nothing is a mystery.'],
            ['Clear chat', 'One button clears the chat for everyone, announcements too. The welcome message stays at the top.'],
            ['Announcements', 'Send a highlighted notice to the whole room.'],
            ['Welcome message and rules', 'Greet everyone who joins and keep the rules one click away in Room info.'],
        ],
        related: ['roles', 'chat'],
    },
    {
        slug: 'roles',
        icon: '👑',
        title: 'Roles & permissions',
        tagline: 'Give people exactly the powers you choose.',
        intro: 'Two layers: roles on the whole site, and roles inside each room.',
        points: [
            ['Site roles', 'Owner, Developer, Admin, Moderator and more, down to Supporter and VIP. The highest one is shown first, and the permission matrix decides what each can do.'],
            ['Room roles', 'Co-Host, Manager, Bouncer and Resident DJ are built in. Create your own with exactly the powers you want.'],
            ['Find anyone', 'Give a room role by searching a name. The person does not have to be in the room.'],
            ['Badges', 'Every role and shop badge shows in front of the name, together with the level.'],
            ['Bots', 'Bots are accounts with a 🤖 badge. They get room roles like anyone else.'],
            ['Nothing hidden', 'Role changes appear in the chat and in the moderation log.'],
        ],
        related: ['moderation', 'avatars'],
    },
    {
        slug: 'avatars',
        icon: '✨',
        title: 'Avatars & the shop',
        tagline: 'Look like you.',
        intro: 'Pick an avatar, upload your own photo, and dress it up.',
        points: [
            ['Avatars', 'Whole characters that stand, dance and DJ, or a picture of your own (an animated GIF keeps moving).'],
            ['Badges, accessories, frames, effects', 'Five shelves with over seventy things to wear, all drawn for SFD-DJ.EU: medals, headphones and crowns, metal and neon frames, flames and sparkles. Buy them with SFD Coins you earn by playing, try them on a live preview first, then save the whole look in one click.'],
            ['Show up on the stage', 'In a room you stand on the floor until you press Woot or Grab, and then you dance. When it is your turn you DJ at the decks at the bottom, with your back to the room.'],
            ['Levels', 'Chat and play songs to earn XP and climb the leaderboards. Every new level pays SFD Coins, and rarer avatars, frames and effects open up as you level up.'],
            ['Profile', 'Your public profile shows your level, stats, rooms and Discord name if you link it.'],
            ['Friends', 'Add friends from a name, a quick profile or the Friends page. Fans are people who woot your songs.'],
        ],
        related: ['rooms', 'music'],
    },
];

export const featureBySlug = (slug: string) => features.find((f) => f.slug === slug);

/** The partners on the home page. `url` makes the card a link; leave it out until there is one. */
export interface Partner {
    name: string;
    mark: 'aurora' | 'record' | 'cord' | 'plug'; // the little picture on the card
    url?: string;
}

export const partners: Partner[] = [
    { name: 'Borealise', mark: 'aurora', url: 'https://borealise.com' },
    { name: 'club.dj', mark: 'record', url: 'https://club.dj' },
    { name: 'cord.dj', mark: 'cord', url: 'https://cord.dj' },
    { name: 'plug.dj', mark: 'plug', url: 'https://plug.dj' },
];

export interface LegalDoc {
    slug: string;
    title: string;
    updated: string;
    summary: string;
    sections: [string, string[]][];
}

export const legal: LegalDoc[] = [
    {
        slug: 'rules',
        title: 'Community rules',
        updated: 'October 2026',
        summary: 'Be good to each other. These rules apply in every room and in whispers.',
        sections: [
            ['Be respectful', ['No harassment, hate, threats or bullying. Disagree with the music, not the person.', 'No sexual content, and nothing that targets someone for who they are.']],
            ['Keep it safe', ['Do not share other people\'s private information.', 'No scams, no phishing, no links meant to trick people.', 'Do not pretend to be staff or another person.']],
            ['Do not spam', ['No flooding the chat, repeated messages or unwanted advertising.', 'Do not try to get around mutes, kicks or bans with another account.']],
            ['Songs', ['Play music that fits the room. A host decides what fits; follow their room rules.', 'Do not queue the same song again and again to annoy people.']],
            ['What happens when rules are broken', ['Room moderators can mute, kick or ban you from their room.', 'SFD-DJ.EU staff can warn you, ban your IP address or remove your account for serious or repeated breaking of the rules. Warnings are listed in Settings → Violations.', 'Think a decision was wrong? Write to us through Contact.']],
        ],
    },
    {
        slug: 'terms',
        title: 'Terms of use',
        updated: 'October 2026',
        summary: 'The agreement between you and SFD-DJ.EU. Draft: have it checked by a lawyer before a public launch.',
        sections: [
            ['Using SFD-DJ.EU', ['You may use SFD-DJ.EU as a guest to watch and read, or with an account to take part. You must give an email address you control.', 'You are responsible for what you do with your account and for keeping your password and tokens safe.', 'You agree to follow the Community rules.']],
            ['Your content', ['You keep the rights to what you write and upload. By posting it you let SFD-DJ.EU show it to the people in the room and store it so the service works.', 'Do not upload or link anything you have no right to share. We can remove content that breaks the rules or the law.']],
            ['Music', ['SFD-DJ.EU does not host music. Songs play from YouTube or SoundCloud through their official players and follow their terms. A song can stop working when its owner removes it or blocks embedding.']],
            ['The service', ['SFD-DJ.EU is provided as it is. It may change, break, or be offline for maintenance. We do not promise it is always available.', 'We may suspend or remove accounts that break these terms.']],
            ['Paid plans', ['The SFD-DJ.EU subscriptions (Bronze, Silver, Gold, Plus, Pro and Premium) are optional plans, paid by the month or the year through Stripe. Their price is shown before you pay. Everything that is free stays free.', 'A plan renews by itself until you cancel it in Settings → Subscriptions. When you cancel, you keep the plan until the end of the time you paid for, and you are not charged again.', 'What a plan gives is listed on the Pricing page. If an account is removed for breaking the rules, its plan ends with it.']],
            ['Developers and bots', ['The API is for building room bots, extensions and tools. Do not use it to spam, scrape private data, or avoid bans. Bot accounts are marked, and their owner is responsible for them.']],
            ['Contact', ['Questions about these terms: use the Contact page.']],
        ],
    },
    {
        slug: 'privacy',
        title: 'Privacy policy',
        updated: 'October 2026',
        summary: 'What SFD-DJ.EU keeps about you and why. Draft: have it checked before a public launch.',
        sections: [
            ['What we keep', ['Your account: username, display name, email address, a hashed password (we cannot read it), your avatar and the shop items you wear.', 'What you do: chat messages, whispers, playlists, votes, friends, XP and the songs you played.', 'Safety data: your IP address is used to enforce IP bans, and room moderation actions are logged.', 'If you link Discord we keep your Discord id and name. If you link Spotify or YouTube, we keep the connected account name/channel and encrypted OAuth tokens so playlist imports work; these tokens are never public.']],
            ['What we do not keep', ['We never store your password in readable form and never email it to you.', 'Saved accounts on the login page live encrypted in your own browser only; they are never sent to the site.', 'We do not sell your data.']],
            ['Who can see what', ['Chat messages are visible to everyone in the room, and to guests watching a public room. Whispers are visible only to the two people in them and to nobody else.', 'Your profile shows your name, level, stats and public rooms. If you connect YouTube, the channel name and link are also public. OAuth tokens and your email address are never shown to other users.']],
            ['Cookies and storage', ['We use a session cookie to keep you logged in, and your browser\'s local storage for things like your volume and your support chat.']],
            ['Your choices', ['You can change your name, email and picture in Settings, turn on two-factor login, and delete your account in your profile. Deleting removes your account and what belongs to it.']],
            ['Other services', ['Songs and some emotes load from YouTube, BetterTTV, 7TV and GIPHY. Those services get your IP address like any website you visit.', 'If you buy a subscription, Stripe handles the payment and keeps your card details; we only keep which plan you have, until when, and the id Stripe gives your subscription.']],
            ['Contact', ['Questions about your data: use the Contact page.']],
        ],
    },
];

export const legalBySlug = (slug: string) => legal.find((d) => d.slug === slug);
