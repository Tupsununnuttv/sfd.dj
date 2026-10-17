/** Every release, newest first. The Patch notes page and the dashboard both read this list. */
export type Kind = 'new' | 'improved' | 'fixed';

export const releases: { version: string; title: string; notes: [Kind, string][] }[] = [
    {
        version: '1.65',
        title: 'Live streams',
        notes: [
            ['new', 'Live streams. Stream your own songs and music on the big screen of a room: start a stream on YouTube, Twitch or Kick, press Go live in the room\'s menu (the host has it; other people need the new room right "Go live", which Co-Hosts get), paste the link and give it a title. Everybody in the room, guests too, sees it at once, with a red Live mark, and the chat goes on beside it. The same controls are in Room settings → Live stream.'],
            ['new', 'A Live streams page in the menu lists every room that is live now, with the title, who streams and how many watch, and a number in the menu shows how many are on. The room cards on the dashboard and the home page get a red Live mark.'],
            ['improved', 'While a stream is on, the songs in the waitlist wait (their clock stops) and Woot, Meh and Grab rest; when it ends they go on where they stopped. The host, Co-Hosts and moderators can end a stream, and one nobody ended stops after 24 hours. The room\'s moderation log and chat say when a stream starts and ends.'],
        ],
    },
    {
        version: '1.64',
        title: 'New subscription prices',
        notes: [
            ['improved', 'New prices for the subscriptions. By the month: Bronze €2.99, Silver €4.49, Gold €6.99, Plus €9.99, Pro €14.99 and Premium €20.99. By the year: Bronze €19.99, Silver €29.99, Gold €39.99, Plus €59.99, Pro €79.99 and Premium €99.99, which is 44% to 60% less than twelve months.'],
            ['improved', 'The Pricing page and Settings → Subscriptions say how many percent each plan saves when you pay by the year, instead of "2 months free".'],
        ],
    },
    {
        version: '1.63',
        title: 'Group whispers',
        notes: [
            ['new', 'Groups in Whispers. Press the group button next to the search box, give the group a name and tick the friends to put in it. Up to 20 people, you included, and only your friends can be added. Everybody in the group gets what is written, live, with the writer\'s name over it. Emojis, emotes, replies and voice messages work in a group just like in a whisper to one person.'],
            ['new', 'The owner of a group can add more friends, take people out and rename it (open People at the top of the group). Anybody can leave. When the owner leaves, the person who has been in the group the longest takes over, and a group with nobody left is gone. Somebody who joins later does not see what was written before they came.'],
            ['improved', 'A send button, an arrow at the end of the text box, in the room chat and in Whispers, so you can send with the mouse as well as with Enter. In Whispers it stays next to the microphone while the box is empty.'],
            ['improved', 'The red number on Whispers counts what groups have written too, and the pop-up and the browser notification say which group a whisper is from. Somebody who has set Privacy to whispers from nobody cannot be put in a group, and a group\'s name goes through the same checks as a message.'],
        ],
    },
    {
        version: '1.62',
        title: 'Emojis, emotes and replies in Whispers',
        notes: [
            ['new', 'Emojis and emotes in Whispers. Press the smiley next to the text box and pick an emoji, a BetterTTV emote or a 7TV emote (search all of 7TV, like in a room\'s chat). Typing an emote\'s name works too: it turns into the emote when you send. They show in the conversation, in the list of conversations and in the reply, and /w username message in a room\'s chat can carry them as well.'],
            ['new', 'Reply in Whispers. Point at a message and press the arrow next to it (on a phone it is always there): your next whisper, or voice message, quotes that message above it, so the other person sees what you are answering. Press ✕ above the text box to cancel.'],
        ],
    },
    {
        version: '1.61',
        title: 'Voice messages, any Spotify playlist and Elementary',
        notes: [
            ['new', 'Voice messages in Whispers. Press the microphone next to the text box, talk (up to 2 minutes) and send it, or throw it away with the bin. The other person plays it in the conversation, with a play button, a bar that fills as it plays and its length. Only the two of you can hear it, and it is deleted with the conversation and with the account.'],
            ['new', 'You can import any public Spotify playlist or album now, somebody else\'s too: paste its link in the search bar of a playlist. You do not have to connect Spotify and you do not have to be its owner. The first 100 songs are read and each is matched to the same song on YouTube. A private playlist, or more than 100 songs, needs Spotify connected with the account that owns it.'],
            ['new', 'Elementary, a new character: a red pixel-art figure in a cap with the sign of Cancer on it, aviator goggles, a gas mask and a zip hoodie, glowing red. Epic, from level 12 (490 SFD Coins). Standing it breathes and its goggles glint, dancing it hops and throws its arms about, and at the decks (seen from behind) it pumps one fist.'],
            ['fixed', 'The red number on Friends goes away as soon as you accept or decline the request, also in a room where the Friends page opens on top of the room.'],
            ['fixed', 'The red number on Whispers goes away as soon as you have opened the conversation and read it, also in a room, and a whisper that arrives in the conversation you are looking at no longer leaves a number behind.'],
        ],
    },
    {
        version: '1.60',
        title: 'SoundCloud plays from SoundCloud',
        notes: [
            ['new', 'A SoundCloud link now adds the SoundCloud track itself. Before, the site looked for "the same song" on YouTube and often found none ("No playable YouTube match"). Paste the link of one track in the search bar of a playlist and it is added with its picture and length; in a room it plays from SoundCloud on the big screen, in step with everybody else, with the same volume, mute and "Tap to start playback with sound" as a YouTube song. Somebody who comes in halfway is put at the right second.'],
            ['improved', 'A SoundCloud track in a playlist has Listen (a small player before you decide), Open on SoundCloud and Copy link, and "Check visible" asks SoundCloud whether it is still there. On the screen of a room the Open on SoundCloud button opens the track at the second it is at.'],
            ['improved', 'Private tracks, SoundCloud playlists (sets) and artist pages cannot be added. Spotify links are still matched to the same song on YouTube.'],
        ],
    },
    {
        version: '1.59',
        title: 'Skelly joins the Staff shelf',
        notes: [
            ['new', 'Skelly, a new character for Brand Ambassadors and above: a retrowave skeleton developer in a neon techwear jacket with "SFD DEVELOPER" on the back, a beanie with his name on it and a little SFD ghost floating at his side. Standing, he waves hello; dancing, he throws his arms up and grins; at the decks, seen from behind, he rocks his arms to the beat while the ghost bobs beside him.'],
            ['improved', 'Adam & Mochi moved from the Common shelf to the Staff shelf in the Avatar shop: Brand Ambassadors and above can wear them now, for free. Anybody else who had bought them got the 80 SFD Coins back and a free character in their place.'],
        ],
    },
    {
        version: '1.58',
        title: 'Staff applications without Discord',
        notes: [
            ['new', 'You can send a staff application (Home → Community → Staff application) without a Discord account linked to your profile. You only need to be logged in. Before, the page asked you to connect Discord first.'],
            ['improved', 'The Requirements on the staff application page are now blue links that open the Discord channels #staff-requirements and #staff-application-questions, instead of a bare channel number. The Discord bot\'s /apply lists the same two channels.'],
            ['improved', 'The staff team sees your SFD-DJ.EU account with a link to your profile in the application. If you do link Discord, they can still give you the staff role there as soon as you are approved; without it, they give you a role on the site instead.'],
        ],
    },
    {
        version: '1.57',
        title: 'A role for every subscription',
        notes: [
            ['new', 'Six new roles, one for each subscription: Bronze, Silver, Gold, Plus, Pro and Premium. Buy a plan and you get the role of the same name straight away: a gem and a name in the colour of the plan, in chat, in the room, on your profile and in the friends and community lists. When the plan ends, the role goes with it.'],
            ['improved', 'The roles belong to the subscription alone: they cannot be handed out by hand, they are not in the Permissions Matrix and they give no staff rights. A role you were given (Moderator, Supporter ...) still comes first, and the role of your plan follows it.'],
            ['improved', 'Plus is a deeper teal and Pro an indigo now, so that no two roles share a colour.'],
        ],
    },
    {
        version: '1.56',
        title: 'A newer API, sfddj 1.1 and a loading screen for rooms',
        notes: [
            ['new', 'The API (/api/v1) knows more: your playlists (make, rename, add and import songs, reorder, shuffle, activate, delete, and queue a whole playlist into a room), the characters you may wear with their pictures, and the subscription prices. GET /api/v1 and GET /api/v1/plans need no token. /me now also tells your character, plan, limits and SFD Coins.'],
            ['new', 'sfddj 1.1 for npm covers all of it, tries again by itself when the site says slow down, gives up instead of hanging, and has a better Bot helper: it shows in the room, has command cooldowns, a custom prefix, reply() and a votes event.'],
            ['improved', 'Settings → Developers shows the API address (https://sfd-dj.eu/api/v1) with a Copy button. Docs → Developers and the Developers page are up to date.'],
            ['new', 'Open a room and a "Loading room…" screen shows at once, with the room name, until the room is open. It works from the dashboard and from every other page that links to a room.'],
        ],
    },
    {
        version: '1.55',
        title: 'Up to 100 playlists',
        notes: [
            ['new', 'Everybody can now make up to 100 playlists, up from 30. The subscriptions give more: 120 playlists on Bronze, 150 on Silver, 175 on Gold, 200 on Plus, 300 on Pro and 500 on Premium.'],
            ['improved', 'The playlist counter under your playlists is easy to read now: "1 of 100 playlists" in bright text with a bar that fills up, turns amber when you are close to the limit and red when you reach it.'],
            ['fixed', 'The counter and the New playlist button now follow your plan. Before, they stopped at 30 even when your plan allowed more.'],
        ],
    },
    {
        version: '1.54',
        title: 'Six subscriptions: Bronze, Silver, Gold, Plus, Pro and Premium',
        notes: [
            ['new', 'The Pricing page now lists six optional subscriptions instead of two, each a step up from the one before: Bronze (€0.99 a month), Silver (€1.49), Gold (€1.99), Plus (€2.99), Pro (€4.49) and Premium (€5.99), or by the year for two months free. Each gives a gem in its own colour next to your name, more XP (from +5% to +50%), more playlists (120 up to 500), more songs in each playlist (6,000 up to 20,000) and more emojis in the rooms you host (35 up to 100). Plus and Premium cost and give what they did before, and everything that is free stays free.'],
            ['improved', 'The same six plans are in Settings, where "SFD-DJ.EU Plus" under More is now "SFD-DJ.EU Subscriptions". The cards sit three to a row, with Free across the top.'],
            ['improved', 'The Premium gem is pink now, so it cannot be mistaken for Gold.'],
        ],
    },
    {
        version: '1.53',
        title: 'Meet Adam & Mochi',
        notes: [
            ['new', 'Adam & Mochi, a new Common character in the Avatar shop (level 3): a bearded DJ in a black robe with red storm clouds, a metal headband and wrapped hands, and his panda Mochi in a little robe of her own. Standing, Adam waves hello while Mochi nibbles a bamboo shoot. Dancing, they bounce in turn: Adam grins, throws his arms about and brings his hands together in a seal, Mochi flaps her arms, and storm clouds drift up behind them. At the decks, seen from behind, Adam scratches with one hand and pumps the other while Mochi bobs beside him.'],
        ],
    },
    {
        version: '1.52',
        title: 'Room addresses follow the room name',
        notes: [
            ['new', 'When you rename a room, its web address changes with the name: "Late Night" at /rooms/late-night becomes "Early Morning Jazz" at /rooms/early-morning-jazz. Everybody who is in the room moves to the new address by itself.'],
            ['improved', 'Every old address keeps working: a link to it goes on to the new one, so shared links, bookmarks and bots do not break. Nobody else can take an old address of your room, and you can take one back by naming the room that way again.'],
        ],
    },
    {
        version: '1.51',
        title: 'The setup lines of the Admin panel are for the Owner',
        notes: [
            ['improved', 'In the Admin panel, the Setup & health lines about live updates, email, Stripe (API and webhook) and debug mode are for the Owner only: the other staff do not get them at all. The mail setup of the Email tab goes only to those who may open that tab.'],
            ['new', 'A new Setup & health line for the Owner, YouTube channel linking, says which redirect address Google Cloud needs and why Google may answer "Access blocked ... has not completed the Google verification process" (error 403): while the OAuth consent screen is in Testing, only the Test users can connect.'],
        ],
    },
    {
        version: '1.50',
        title: 'Fox is for the Owner only',
        notes: [
            ['improved', 'Fox, the street fox, is now for the Owner only, on the Owner shelf in the Avatar shop next to Rift, Skully and Zoo S02. Anyone else who had bought him got their SFD Coins back.'],
        ],
    },
    {
        version: '1.49',
        title: 'Meet Boomer, a turtle with a boombox shell',
        notes: [
            ['new', 'Boomer, a new Epic character in the Avatar shop (level 20): a chill turtle in a pink bucket hat, round shades and a gold record on a chain, whose shell is a boombox with two woofers, a tape deck and an equalizer. Standing, he waves hello. Dancing, his arms swing and the bass shakes the speakers and sends sound waves out. At the decks, seen from behind, the whole boombox shows: the reels turn, the equalizer bounces, and he pumps one fist while scratching with the other.'],
        ],
    },
    {
        version: '1.48',
        title: 'Meet Pip, a penguin DJ',
        notes: [
            ['new', 'Pip, a new Rare character in the Avatar shop (level 7): a chill penguin DJ in a crimson beanie, cyan headphones with glowing cups and a violet bow tie. Standing, Pip waves a flipper hello. Dancing, the flippers flap and snowflakes drift down around him. At the decks, seen from behind, he pumps one flipper and scratches with the other.'],
        ],
    },
    {
        version: '1.47',
        title: 'Watch before you add, Fox, and an Owner shelf',
        notes: [
            ['new', 'Watch a song\'s video before you add it: press the picture of a track in your playlist (or Watch video in its menu), or Watch next to a search result. The video opens in a window over the page, with Add and Queue under it. The room goes quiet while you watch, and its music comes back when you close the window.'],
            ['new', 'Fox, a new Epic character in the Avatar shop (level 12): a sly street fox in an olive bomber jacket with a red bandana and a gold hoop in one ear. Standing, he winks while his ears twitch and his big tail sways. Dancing, he swings his arms while sparks fly. At the decks, a fox head on the back of his jacket and a fist in the air.'],
            ['improved', 'Panda Bear is a character for people with a role now: Brand Ambassadors and the roles above them. Anybody else who had bought him got their SFD Coins back.'],
            ['improved', 'The Avatar shop has a shelf of its own for the Owner\'s characters (Rift, Skully and Zoo S02).'],
        ],
    },
    {
        version: '1.46',
        title: 'Meet Wilmer, and Donate stays in one window',
        notes: [
            ['new', 'Wilmer, a new character in the Avatar shop (level 4): honey-blond hair with a big quiff, freckles and a wide grin, a teal varsity jacket with a W on the chest, rolled jeans and white sneakers, and headphones round his neck. Standing, he waves hello. Dancing, he pumps his fists in turn while notes rise around him. At the decks the headphones go on, and the back of his jacket says WILMER.'],
            ['fixed', 'Donate in the room footbar opens the payment page in the same window, not a new one.'],
        ],
    },
    {
        version: '1.45',
        title: 'Beta Tester is a badge for everybody',
        notes: [
            ['improved', 'Beta Tester is no longer a role with the flask icon. Everybody has the teal Beta Tester badge instead, in front of their name in chat, in the room\'s user list, on profiles and in the Admin panel. Everybody who signs up during the beta gets it too.'],
            ['fixed', 'Special badges (Beta Tester, Bug Hunter, Community Hero ...) now show in front of names in room chat. Before, chat left them out.'],
        ],
    },
    {
        version: '1.44',
        title: 'Rooms open faster, on newer foundations',
        notes: [
            ['improved', 'Rooms open faster. Every room background is a file of its own now, so a room loads only the background it shows. The room itself loads about a fifth of what it did.'],
            ['improved', 'The site runs on the newest versions of what it is built with: React 19, Inertia 3, TypeScript 7 and the rest. Pages change and forms save as before.'],
        ],
    },
    {
        version: '1.43',
        title: 'Words that never go out, and everything points at sfd-dj.eu',
        notes: [
            ['new', 'Some words cannot be written on SFD-DJ.EU at all: slurs (about gay people, women or where someone comes from) and words about abusing children, "pdf" included. A chat message or whisper with one of them is not sent, and you see why. This holds for everybody, staff and bots too. Spellings that try to hide the word are caught as well: spaced-out letters, digits for letters, stretched letters and look-alike letters. Room hosts can still add their own words in AutoMod.'],
            ['improved', 'The Discord bot always works with sfd-dj.eu: /status checks it, /profile and the website updates come from it, updates link to it, and the bot shows "Listening to sfd-dj.eu".'],
            ['improved', 'The sfddj npm package for room bots talks to https://sfd-dj.eu by itself. You only give baseUrl for another copy of the site.'],
        ],
    },
    {
        version: '1.42',
        title: 'The confirm link works everywhere, and new log in pages',
        notes: [
            ['fixed', 'The "Confirm my email" link in the welcome email works in any browser now: logged in as that account, as somebody else, or not logged in at all. It used to end on a "403 This action is unauthorized" page unless that same account was logged in. An old or changed link now says why it no longer works, instead of an error page.'],
            ['improved', 'Log in and Create account have a new look: the form sits in a card with Log in / Create account tabs on top, and next to it a stage where characters from the Avatar shop dance in front of a light wall. On phones the dancers stand above the form.'],
            ['new', 'Create account shows a preview of how you will look in rooms (your name, @username, Beta Tester badge and level), and the form is split into three short steps.'],
            ['improved', 'The home page: characters dance in front of the room picture, the numbers sit in one bar, the partners fit one row, Live right now has a "Start your own room" card, and a new "Dress up your DJ" card shows characters from the Avatar shop.'],
            ['fixed', 'Signing up without an invite link no longer counts as an invite from an older account, and the sign-up page no longer says that somebody invited you when nobody did.'],
            ['improved', 'On phones the Live support button is just the round icon, so it hides less of the page.'],
        ],
    },
    {
        version: '1.41',
        title: 'Kiko & Mochi, better Room settings, and you stay in the room',
        notes: [
            ['new', 'Kiko & Mochi, a new Epic character in the Avatar shop (level 16): a DJ girl with lilac space buns and pink headphones, and her Shiba puppy Mochi beside her. Standing, Mochi wags its tail and looks up when Kiko reaches out to pet it. Dancing, they hop in turn (Mochi with its front paws up) and hearts rise between them. At the decks, Mochi bobs along while Kiko pumps a fist.'],
            ['fixed', 'Connecting Spotify, Discord or YouTube from your settings inside a room no longer takes you out of the room. The sign-in opens in a small window of its own, closes when it is done, and the page in the room shows the new connection.'],
            ['fixed', 'Room settings → Music & Waitlist → Auto Host no longer sends you out of the room to make a bot. You can make the bot right there, and Settings → Developers opens over the room.'],
            ['improved', 'Room settings have a new look: the parts are listed on the left with icons and a line about each one, and every part is laid out in clear boxes. General shows a big preview of the background you pick, counts the letters in the name, description and welcome message, and has a save bar that tells you when something is not saved yet. You can undo your changes, and the window stays open after saving.'],
        ],
    },
    {
        version: '1.40',
        title: 'A new logo, donations and four new characters',
        notes: [
            ['new', 'SFD-DJ.EU has a new logo: a bold S in a glossy tile that runs from violet to cyan, ringed by a sound spectrum with a playhead. It is in the menu, on the browser tab, on phones and on shared links.'],
            ['fixed', 'Kick and ban work at once: the person disappears from the room for everybody, leaves the waitlist and the decks (their song stops), and their own page leaves the room before it tells them why. A banned person cannot come back until a moderator lifts the ban. A kicked or banned bot leaves the room too, and is no longer the Auto Host.'],
            ['new', 'Donate: a new button in the room footbar opens the Donation Goal. It shows the goal and how far along it is, and you can give any amount from €1, with your name or anonymously. Payments go through Stripe. The room says thank you, and the goal goes up by itself.'],
            ['new', 'When a newer version of the site is out, a "New update available" button appears in the room footbar. Press it to reload and get the newest version.'],
            ['improved', 'The More menu in the room footbar has Community (Events, our Discord and the other links set in Community settings) and Help (FAQ, Contact support and Patch notes).'],
            ['new', 'Four new characters in the Avatar shop. Milky (level 6), a milk carton that squashes and stretches as it dances. Panda Bear (level 12), who munches bamboo and waves it like a glow stick. Two Legendary dragons: Ember Dragon (level 30), with a flame on his tail and smoke from his nose, and Frost Dragon (level 35), with crystal horns and falling snow. The dragons\' wings flap and their tails whip in three parts.'],
            ['improved', 'Rift and Skully are now for the Owner only. Anyone else who had bought one got their SFD Coins back.'],
        ],
    },
    {
        version: '1.39',
        title: 'Auto Host, Autowoot, Compact and two spooky characters',
        notes: [
            ['new', 'Spooky, a jack-o\'-lantern scarecrow, is a new Epic character in the Avatar shop (level 14). His carved pumpkin head glows with a flickering candle, he wears a torn cloak, a striped scarf and curled boots, and he carries an iron lantern with a green ghost flame. Bats and will-o\'-wisps float around him. The lantern swings, and his cloak and scarf move a moment after he does.'],
            ['new', 'Skully, a skeleton DJ, is a new Epic character in the Avatar shop (level 18). Every bone is drawn separately, from the cracked skull with its chattering jaw down to the toes. He stands with a hand on his hip and dances the old skeleton dance: knees knocking, arms swinging up in turn. At the decks he puts on headphones and pumps a fist.'],
            ['new', 'Two new room backgrounds for hosts: Synthwave V2, a neon city at night with light trails on the highway and a sports car, and Retrowave V2, an 80s beach at sunset with palms, a neon flamingo and a Ferris wheel that turns while a song plays.'],
            ['new', 'Auto Host: in Room settings → Music & Waitlist, the host can pick one of their bots and a playlist. When the waitlist is empty, the bot plays songs from that playlist. As soon as somebody joins the waitlist, the bot steps aside. Make a bot first in Settings → Developers.'],
            ['new', 'Autowoot: point at Woot (or press its ⋯ on a phone) and switch on Autowoot. You then woot every new song automatically, in every room, until you switch it off. An AUTO tag on Woot shows that it is on.'],
            ['new', 'Settings → Appearance → Compact: tighter spacing everywhere, so more chat lines, people and songs fit on the screen.'],
            ['improved', 'Song search in a room also finds songs by their title among the songs already saved in playlists on SFD-DJ.EU. Search therefore still works when YouTube\'s daily search limit is used up. YouTube search results are now kept for a day.'],
            ['fixed', 'When you leave a room or close the site, you also leave the waitlist and the decks, even with Cycle waitlist on. Somebody whose connection drops is taken out of the line, not given a turn.'],
            ['improved', 'Translators, Promoters and Helpers have their own Staff 2 group in the room\'s user list.'],
        ],
    },
    {
        version: '1.38',
        title: 'Room roles, visible bots and clearer playlists',
        notes: [
            ['new', 'Eight new frames in the Avatar shop. Fireflies (level 3): three fireflies circle a golden ring. Comic Pop (level 5): a comic-book border with action lines, a star and a "!" bubble. Spider Web (level 9): a spider bobs on its thread. Candlelight (level 12): candles flicker on an iron ring. Skull Ring (level 16): neon skulls with glowing eyes. Lanterns (level 20): red lanterns sway on a red and gold ring. Crystal Grove (level 25): amethyst crystals that glint. Rift Portal (level 32): swirling rings of energy.'],
            ['fixed', 'When the live-update server (Reverb or Pusher) is down, a chat line, vote or song is still saved and no error page appears. Others see the change at their next refresh instead.'],
            ['fixed', 'Forgot password no longer shows an error page when the email cannot be sent. It says so and asks you to try again later. A new password is always saved, even when the "your password was changed" email cannot go out.'],
            ['fixed', 'The twinkling sparkles on frames, accessories and effects now stay in place. While they moved, they used to jump to the top-left corner of the avatar.'],
            ['new', 'Rift, a raven mage, is a new Legendary character in the Avatar shop (level 25). He wears a violet hood with glowing purple eyes, a feather cape that turns to starlight, and a galaxy amulet, and he carries a staff with a galaxy orb. Crystals float around him. He stands, dances with his wings, and at the decks he raises a fist.'],
            ['fixed', 'The Room header now names the room host, not the person viewing it.'],
            ['improved', 'Room users are ordered by site role, from Owner down to User; people with the same role are alphabetical, room roles keep their existing groups, and API bots are always last. The Admin → Users → Set role list follows the same role order.'],
            ['improved', 'API bots now appear on the room stage as full characters. Chat activity refreshes their room presence automatically; quiet bots can send a heartbeat and disappear when they disconnect.'],
            ['new', 'Playlist → Check visible checks up to 50 songs at a time. Available videos are marked green; deleted, private or non-embeddable videos are marked Unavailable Song.'],
            ['fixed', 'Profile photos no longer replace full-body characters. Missing pictures fall back to a character, and room playback avoids seeking for small timing differences.'],
        ],
    },
    {
        version: '1.37',
        title: 'GIPHY, events and a better room on phones',
        notes: [
            ['fixed', 'Choosing Mention no longer leaves a stale request behind that could add the same @name again when reopening chat.'],
            ['improved', 'On phones, switch between the room scene and full-screen Chat, Waitlist or Users views. Desktop keeps its side-by-side layout.'],
            ['improved', 'Waitlist and room activity (joining or leaving, Woots, Grabs and song endings) appears briefly beside the chat. Other system messages stay in chat.'],
            ['new', 'Any signed-in member can create events and delete their own; staff can still manage all events.'],
            ['improved', 'The GIF picker searches GIPHY for trending GIFs and search terms, shows Powered By GIPHY, and accepts GIPHY links.'],
            ['improved', 'YouTube playlist imports now handle up to 1,000 songs at a time. Playlists hold at least 5,000 songs (more with Plus and Premium). Spotify playlist imports are unavailable without account authorization; individual Spotify tracks still work.'],
        ],
    },
    {
        version: '1.36',
        title: 'Seasons, Plus and Premium, and no links to other sites',
        notes: [
            ['new', 'Halloween and Christmas come by themselves: in October every room shows the Halloween background, from 1 December to 6 January the Christmas one. The host can pick the other one of the season (Halloween V2, Christmas V2) in Room settings → Background → Special, or any other background to switch it off in the room. When the season is over, the room shows its own background again.'],
            ['new', 'SFD-DJ.EU Plus (€2.99 a month or €29.99 a year) and Premium (€5.99 a month or €59.99 a year), both optional: a gem next to your name, +25% or +50% XP, 60 or 100 playlists with up to 1,000 or 2,000 songs each, and 50 or 100 emojis in the rooms you host. Buy, change or cancel in Settings → Plus; payments go through Stripe and are switched on as soon as the site has its Stripe keys. Staff can also give a plan by hand in the admin panel. The prices are on the Pricing page.'],
            ['new', 'Links to other sites can no longer be shared: not in the chat, not in whispers, not in a bio or the texts of a room. SFD-DJ.EU itself and our partners club.dj, borealise.com (and app.borealise.com) and cord.dj are fine. Addresses are found with or without https:// and www., also written as "name . dj" or "name(dot)dj", and other music sites are refused by their name too. A blocked chat message shows in the moderation log.'],
            ['new', 'Room moderation → Moderation logs: the host and SFD-DJ.EU staff can delete a line (its bin) or clear the whole log. Moderators cannot, as the log is how their actions are checked.'],
            ['improved', 'The home page shows a new picture of a room, and our partner is called by its right name: Borealise, with a link to borealise.com.'],
        ],
    },
    {
        version: '1.35',
        title: 'Halloween V2, Easter, Midsummer and new role icons',
        notes: [
            ['improved', 'The music starts by itself when you are in a room: no more “Click to join the room” over the video. A browser that keeps the sound back until you have clicked on the page plays the video muted meanwhile and says so in a small button; the first click or key anywhere turns the sound on. Settings → Audio no longer has “Keep playing after a refresh”, as it always does now.'],
            ['new', 'Room settings → Background has a group of its own, Special, for the Halloween and Christmas backgrounds (Halloween, Halloween V2, Christmas and Christmas V2). Like the other custom backgrounds, only the host sees and picks them.'],
            ['new', 'Halloween V2: midnight in a witch\'s lair. The video hangs in a black frame with a skull at each corner and the name on a sign under it, and a cauldron bubbles green over a green fire below. A pointed window looks out on a green moon with a witch on her broom, bats, lightning and a graveyard, between torn purple curtains; a tall cabinet holds glowing potions, a crystal ball and books, with a raven on top. Candles float in the air, little jack-o\'-lanterns hang over the window, spiders hang from cobwebs, and in the front corners lie a heap of jack-o\'-lanterns with a black cat and an open spell book. While a song plays the flames flicker, the candles float, the cauldron bubbles and steams, the witch flies across the moon, lightning flashes and green and purple sparks rise over the room.'],
            ['new', 'Easter: a sunny Easter morning in the garden. The video hangs in a frame of woven willow with ribbons, tulips and eggs, a “Happy Easter” sign under it and a giant painted egg in a straw nest below, with a bunny peeking out from behind it. An egg tree hung with painted eggs, a birch with a bird house, a white chapel and lambs on the hills, a picket fence with tulips, bunting of eggs, a meadow with eggs hidden in the grass, a nest ring of eggs under the booth, a basket of eggs with chicks and a big white bunny. Pastel confetti falls while a song plays.'],
            ['new', 'Midsummer (Jaanipäev): Midsummer Eve, the white night. A sunset sky over a lake with a sauna and a rowboat, the video in a frame of birch logs with young birch branches and flower wreaths, a big bonfire below, birches, the village swing against the sunset, string lights, a meadow of daisies, cornflowers and buttercups with a flower wreath under the booth, the magic fern flower and a stump with an axe, sauna whisks and firewood. The fire burns, the swing swings and fireflies rise while a song plays.'],
            ['new', 'All three are also 1600 x 900 pictures: public/backgrounds/halloween2.png, easter.png and midsummer.png.'],
            ['new', 'New icons for every role: each is a modern line icon in the colour of the role on a small tile (Owner, Developer, Admin, Lead Moderator, Brand Ambassador, Moderator, Site Moderator, Helper, Promoter, Translator and the other roles). They show in front of names in the chat, the user list, the quick profile and the admin panel.'],
            ['new', 'The Users tab of a room lists everybody under their room role, each with its icon: Host (a crown), Co-Host (an outlined crown), Manager (two chevrons), Bouncer (one chevron), Resident DJ (a record), the host\'s own roles, then everyone else. Every row shows the level, and the DJ who is playing is marked Current DJ.'],
            ['new', 'Everybody who makes an account gets the Beta Tester role right away.'],
            ['fixed', 'The smoke over chimneys, fires and lanterns in the Christmas, Halloween, Winter, LATAM, Ultra and Midsummer backgrounds now rises from where it starts. It used to grow from the corner of the room and drift across the picture.'],
            ['new', 'Admin panel → Users: staff with the right to manage users can delete an account (only of people ranked below them). Their rooms, playlists, messages and friends go with it.'],
        ],
    },
    {
        version: '1.34',
        title: 'Volume and progress in the top bar',
        notes: [
            ['fixed', 'The dropdown lists (Country and Favourite genre in your profile, Any role, Everyone and Newest first in the admin panel, and every other one on the site) now open dark. They used to open white, so you could not read what you were picking.'],
            ['improved', 'The volume and the mute button moved up to the right side of the top bar of a room. How far the song is now runs right under “… is playing:” in the middle of the top bar.'],
            ['improved', 'The footbar is tidier: the Playlists button is gone from it, as Playlists is in the menu on the left. Your active playlist and your next track stay in the footbar.'],
            ['fixed', 'Woot, Grab and Meh no longer fade out when nothing is playing (for example while nobody is in the Waitlist). They stay as bright; they can be pressed as soon as a song starts.'],
        ],
    },
    {
        version: '1.33',
        title: 'Christmas V2',
        notes: [
            ['new', 'A second Christmas background for the host (Room settings → Background → Custom backgrounds): Christmas V2, Christmas Eve inside a warm lodge. The video hangs in a gold frame on a stone chimney breast, over a mantel with candles, two nutcrackers and a garland, four stockings, a wooden SFD-DJ.EU sign and a fire in the hearth. On the left a window looks out on a snowy night with Santa\'s sleigh across the moon, between red velvet curtains, with milk and cookies left out for Santa. On the right stands a big tree with warm lights, red and gold baubles, a ribbon and presents. Under the booth lies a round braided rug; in the front corners are Santa\'s sack, a cat asleep in a Santa hat and a toy train coming out of a snowy tunnel.'],
            ['new', 'While a song plays the fire and the candles flicker, the lights twinkle, it snows outside the window, the sleigh crosses the moon, the stockings sway, the train runs and gold glitter drifts down over the room. The booth has two candles in holly and a garland with warm lights. Also as a 1600 x 900 picture: public/backgrounds/christmas2.png.'],
        ],
    },
    {
        version: '1.32',
        title: 'Grab that works, and a chat that tells you more',
        notes: [
            ['fixed', 'Grab: a grabbed song used to go into a built-in list that nobody could see, so it looked as if grabbing did nothing. Now Grab asks which of your playlists the song goes in. With no playlist yet it asks you to make one first (type a name, and the song goes right into it). The old hidden Grabs lists became ordinary playlists called Grabs.'],
            ['new', 'Everybody has a character. A new account starts as a free character straight away, not as a letter in a coloured circle, and the Initial avatar is gone from the Avatar shop. People who had no avatar were given one. Taking your photo off gives you a character again.'],
            ['new', 'The chat tells you when somebody leaves the room, and when somebody woots, mehs or grabs the song (once per person and song), like it already told you about joins. They are not saved, and Settings → Appearance can switch the joins, leaves and votes off.'],
            ['new', 'The first line of the chat, above the welcome message of the room, says: Welcome to SFD-DJ.EU, Version 1.32, with a link to what is new.'],
        ],
    },
    {
        version: '1.31',
        title: 'Confirming your email',
        notes: [
            ['new', 'The “confirm your email” message goes out when somebody signs up, when they press Send (on the confirm page or on the bar at the top of the site) and when they change their address in Profile. It has a proper look, one button and a link that works for an hour.'],
            ['new', 'Nobody is stuck waiting for a message that cannot come. While the site cannot send email (no mail server in .env), or when staff leave the confirming optional, a new member gets in at once, and the confirm page says what is going on with a Continue to SFD-DJ.EU button. A bar at the top invites them to confirm later.'],
            ['new', 'A mail server that is down no longer breaks signing up or the Send button: the account is made, and the page says the server did not take the message so they can try again.'],
            ['new', 'Admin panel → Email: whether the site can send email, how to turn it on (for example with a Gmail app password in .env), a button that sends a test email to you and tells you what happened, and a switch: confirming required or optional. The Users tab shows who has not confirmed and lets staff confirm somebody by hand.'],
        ],
    },
    {
        version: '1.30',
        title: 'Your profile, your room',
        notes: [
            ['new', 'Everything shows at once. Buy something in the Avatar shop (it opens inside the room) and put it on, change your status, your flag, your pronouns or your name, and you and everybody in the room see it straight away: in the user list, in the chat and in the menu, with your coins counting down. Nobody has to refresh any more.'],
            ['new', 'Profile: a flag (any country, England, Scotland, Wales, Northern Ireland, the EU and a few more), pronouns, and a bio of up to 500 characters with line breaks. The flag shows on your profile, in the quick profile card and next to your name in the user list; the pronouns and the bio show on your profile and in the card.'],
            ['new', 'Status: Online, Busy, Away and Offline, from the menu under your picture or in Profile. It is a coloured dot next to your picture in the menu, the rooms, the friends lists and your profile. Busy means do not disturb: no pop-ups for whispers and friend requests. Offline makes you look offline to everybody.'],
            ['new', 'Special badges for people who earned them: Beta Tester, Founding Member, Bug Hunter, Contributor, Event Champion, Tastemaker and Community Hero, each drawn as a seal. Staff give them in the admin panel (Users tab). Everybody who was here before the opening is a Beta Tester, and the Owner is a Founding Member too. They show in front of a name, and with their meaning on the profile.'],
            ['new', 'Room rules: the host writes up to ten rules (Room settings → Rules), each with a title and a few words, and everybody who comes into the room reads them and presses “I agree”, or “Do not show again in this room”. When the rules change, everybody reads them again, at once. The old block of rules became a list.'],
            ['new', 'Room CSS: the host can style the room with their own CSS (Room settings → Room CSS), with classes for the chat, the bars, the stage, the crowd and the buttons, five examples to start from and a list of what was left out. Only harmless CSS is kept: no scripts, no @import, no fixed overlays, pictures only from https addresses. The room gets it the moment it is saved.'],
            ['new', 'Three new custom backgrounds for hosts: Tastycat (a pastel bakery for cats with a cake, a cabinet of cupcakes, a chef cat and falling sprinkles), Tasty (a night food market with burgers, noodles, a marquee frame and a pizza under the booth) and Monstercat (a neon arena with two huge monster cats on either side of the video).'],
            ['improved', 'When the host changes the room (name, scene, rules, CSS), everybody in the room gets it at once, guests too. The Avatar shop label in the menu no longer wraps when you have a lot of coins.'],
        ],
    },
    {
        version: '1.29',
        title: 'SFD Coins',
        notes: [
            ['new', 'SFD Coins: the money of the Avatar shop. Avatars, badges, accessories, frames and effects now cost coins and open at a level; the higher the level, the more they cost (a character costs a little more than a badge). What costs nothing at level 1 is free for everybody, what you buy is yours for good, and SFD-DJ.EU staff still have everything.'],
            ['new', 'You earn coins by playing: 10 coins times the level for every new level, 5 coins when a song of yours is played (and 1 more for every 2 woots; a song that is skipped at once pays nothing), 2 coins when somebody grabs it, 50 when a friend joins with your link (the first 20 friends) and 25 a day from the daily reward, on the dashboard and in the shop.'],
            ['new', 'The shop has a wallet with your coins, the daily reward, how to earn more and your latest coins. Every item shows its price: buy it on its card, or try things on and buy everything in your look in one go. The filters are All, Owned, For sale and Locked. Your coins also show next to Avatar shop in the menu.'],
            ['improved', 'Everybody who was here already got 100 coins plus the coins of every level they had reached, and keeps what they wear. Coins are private: only you see yours.'],
        ],
    },
    {
        version: '1.28',
        title: 'A new Avatar shop, a fox and a dragon',
        notes: [
            ['new', 'The Avatar shop has all-new badges, accessories, frames and effects, drawn from scratch instead of emoji and plain rings. 16 badges: medals that go from bronze and silver discs to gold starbursts (Rookie, Selector, Crate Digger, Bassline, Hot Streak, Night Owl, Voltage, Golden Ear, Diamond Cut, Spotlight, Platinum Disc, Laureate, Royal, Cosmic, Dragon Seal, Legend).'],
            ['new', '16 accessories: DJ headphones, aviators, a snapback, a beanie, cat ears, fox ears, a flower crown, a halo, a cyber visor, a laurel wreath, devil horns, a top hat, a royal crown, angel wings, dragon horns and a phoenix crest.'],
            ['new', '13 frames: bronze, silver and gold metal, neon, carbon, emerald, vinyl, an equalizer, rose thorns, frost, hellfire, aurora and prism. And 12 effects: a soft glow, sound waves, sparkles, music notes, hearts, sakura, snowfall, flames, thunder, toxic haze, cosmic dust and a void.'],
            ['improved', 'Items unlock from level 1 up to level 55 and come as Common (levels 1 to 3), Rare (4 to 9), Epic (10 to 24) or Legendary (25 and up). The old emoji badges and accessories and the old rings and glows are gone, and what people wore was cleared: pick your look again in the shop. Frames, effects and some accessories move while animations are on.'],
            ['new', 'A Foxy background for the host (Room settings → Background): an autumn forest at dusk in the colours of Foxy, with a big low moon, two maples in full colour, a big fox and a cub, string lights, a sign over a den in a mossy mound, glowing mushrooms, pumpkins and fireflies, and a wreath of leaves with paw prints under the booth. Leaves fall over the room. It is also a 1600 x 900 picture: public/backgrounds/foxy.png.'],
            ['new', 'A Dragon background: a long red and gold dragon coils round the video, over the top and down the left side to its head, with its mouth open and a glowing pearl in front of it. Behind it a stormy night with a pale moon, lightning, ink-dark peaks and a pagoda; red lanterns swing by the video, a red carpet runs over the courtyard to a golden ring under the booth, and embers rise over the room (public/backgrounds/dragon.png).'],
            ['improved', 'In Foxy the DJ booth has little foxes on its corners, and in the Dragon room glowing pearls.'],
        ],
    },
    {
        version: '1.27',
        title: 'Skull, Skulls and Ultra Music Festival',
        notes: [
            ['new', 'A Skull background for the host (Room settings → Background): a giant skull with burning eyes and the video in its forehead, a blood moon and lightning, braziers on both sides, heaps of skulls with red eyes, a floor with glowing cracks and a ring of spikes under the booth. It is also a 1600 x 900 picture: public/backgrounds/skull.png.'],
            ['new', 'A Skulls background: a candlelit catacomb with two niches stacked with skulls and bones, a crypt door with an arch of skulls and an iron gate under the video, skull lanterns that burn green, candelabra, cobwebs, mist and a ring of skulls under the booth (public/backgrounds/skulls.png).'],
            ['new', 'An Ultra Music Festival background: a main stage at night with LED wings, a neon ULTRA MUSIC FESTIVAL sign, searchlights and moving heads, fireworks over a skyline with palms, jets of fire and CO2, speaker stacks and a crowd with its arms in the air (public/backgrounds/ultra.png).'],
            ['new', 'While a song plays the lights sweep, the LEDs flash, the fires and the candles flicker, the lanterns swing and the fireworks burst.'],
            ['improved', 'In Skull and Skulls the DJ booth has little skulls on its corners.'],
        ],
    },
    {
        version: '1.26',
        title: 'A gold mine',
        notes: [
            ['new', 'A Gold Mine background for the host (Room settings → Background): the video hangs in a heavy timber frame, under it a door into the mine with a sign over it, rails going in and a light far inside. Veins of gold run through the rock, with crossed pickaxes, a cluster of crystals, a hard hat with its lamp on, a ladder, barrels, a crate of TNT, a chest running over with gold, a pyramid of gold bars, rails along the foot of the wall and a big golden coin on the floor under the booth. It is also a 1600 x 900 picture: public/backgrounds/goldmine.png.'],
            ['new', 'The lanterns swing and flicker, the gold glints, dust drifts and a cart of gold rolls along the rails while a song plays.'],
            ['improved', 'In the Gold Mine the DJ booth has piles of gold bars on its corners.'],
        ],
    },
    {
        version: '1.25',
        title: 'A room can have several badges',
        notes: [
            ['new', 'A third room badge: ◆ Official, next to ✓ Verified and ★ Partnered.'],
            ['improved', 'A room can carry any mix of the three badges at once. In the admin panel, Rooms tab, each room has a switch for every badge instead of one choice.'],
        ],
    },
    {
        version: '1.24',
        title: 'Levels 1 to 100, a waitlist of 67, and only characters in the shop',
        notes: [
            ['new', 'The levels go from 1 to 100 (level 100 needs 196,020 XP). The bar is full and says MAX at the top.'],
            ['new', 'The Owner, the Developers and the Admins are at level 100.'],
            ['new', 'The waitlist holds 67 people at most. The Waitlist tab says how many are in it (for example 3/67), and when it is full the card says Waitlist full until somebody leaves.'],
            ['improved', 'The Avatar shop only has characters now. The animated avatars (Spin, Ghost beat, Ember, Robo DJ, Neon cat and Fang) are gone from it; somebody who already wears one keeps seeing it.'],
        ],
    },
    {
        version: '1.23',
        title: 'The welcome message stays at the top',
        notes: [
            ['improved', 'The welcome message of a room is pinned at the top of the chat. The messages and the system lines scroll under it, and 🧹 Clear does not take it away.'],
            ['improved', 'The Waitlist tab no longer has the Skip Song and Leave Waitlist buttons: Skip is in the bar at the bottom of the room and Leave Waitlist is the card by the booth.'],
        ],
    },
    {
        version: '1.22',
        title: 'Open on YouTube, and Leave Waitlist with cycling',
        notes: [
            ['new', 'Point at the video in a room and an Open on YouTube button shows in its corner: it opens the song on YouTube, at the place it is at now.'],
            ['fixed', 'Leave Waitlist works while Cycle Waitlist is on, also when it is your song that plays: you leave the line and do not go to the back of it. The same goes for a DJ who is taken out of the line by the room team.'],
            ['improved', 'When it is your own song, Woot, Grab and Meh look the same as always (no longer faded); you just cannot press them.'],
        ],
    },
    {
        version: '1.21',
        title: 'The DJ is seen from behind',
        notes: [
            ['new', 'When it is your song you stand at the decks of the DJ booth, between the turntables, with your back to us, looking at the screen: every character has a new DJing picture drawn from behind (the hair or helmet, the hoodie with its logo big on the back, the tail). When you are not DJing you stand in the crowd facing front, as before.'],
            ['improved', 'The booth and its cards are a little higher, so the booth covers the DJ from the waist down.'],
        ],
    },
    {
        version: '1.20',
        title: 'A cat café',
        notes: [
            ['new', 'A Cat café background for the host (Room settings → Background): the video is a window with curtains, under it a shelf where four cats sit and watch, a cat tree with a cat on top, a bookcase where two cats sleep, a mouse in its hole, a cat flap, a floor of wood and a round rug of paws under the booth. It is also a 1600 x 900 picture: public/backgrounds/cats.png.'],
            ['new', 'The tails swish, eyes shine, a ball of yarn rolls over the floor and a red dot dances for the cats to chase while a song plays.'],
        ],
    },
    {
        version: '1.19',
        title: 'Four more rooms, and a picture of your own',
        notes: [
            ['new', 'Upload your own picture as the background: Room settings → Background → Upload your own picture (PNG, JPG or WebP, at least 800 x 450, up to 6 MB). Only the host can; it is put on at once, everybody in the room sees it, and you can swap or remove it any time.'],
            ['new', 'Midnight Definity: a midnight sky with the Milky Way, a crescent moon, shooting stars and a satellite, a glowing infinity sign with a pulse of light running along it, a glass frame, and a black mirror of a floor with an infinity ring under the booth.'],
            ['new', 'Anime: a summer evening on a rooftop in the city, in the way of the films. A sky from deep blue to pink and gold, towering clouds, a comet and fireworks, the skyline with a tower, a train on the viaduct, paper lanterns, a fence with a cat on it, a vending machine, a magic circle under the booth, and cherry blossom falling over the room.'],
            ['new', 'LATAM: a warm evening in a Latin American town. A big sun with turning rays, a volcano, hillsides of colourful houses and a church, paper flags that sway, a piñata, a macaw across the sky, a llama in the street, agave and cactus, a frame of tiles and a floor of painted tiles with a sun under the booth.'],
            ['new', 'Lightshow: a dark club that is all lights. Moving heads sweep beams across the room, laser fans, two mirror balls, LED columns by the booth, spots that drift over a floor of tiles that flash, and a rainbow LED frame round the video.'],
        ],
    },
    {
        version: '1.18',
        title: 'A stage at the bottom, a waitlist of people, and chat that tells you more',
        notes: [
            ['new', 'The DJ booth, Join / Leave Waitlist and Woot, Grab, Meh are at the bottom of the room, against the footbar. The DJ stands at the decks; everybody else stands on the floor above the stage.'],
            ['new', 'The Waitlist tab lists people, not songs: press Join Waitlist and you are in the line. When your turn comes, the top track of your active playlist plays (the one it is then, not the one it was when you joined). With cycling on you go to the back of the line with your next track. The Queue buttons in the playlists are gone.'],
            ['new', 'Chat tells you when a song has ended and who joined the waitlist, and every kind of system line has its own colour: joins and promotions green, leaving orange, the waitlist blue, a song that ended cyan, skips yellow, grabs pink, bans and kicks red, mutes purple.'],
            ['improved', 'A site broadcast from the admin panel shows only in the chat of every room, as System broadcast. The bar over the top of the page is gone.'],
            ['fixed', '🧹 Clear now removes every message for good, announcements and broadcasts too, and nothing comes back when the page is refreshed.'],
        ],
    },
    {
        version: '1.17',
        title: 'Synthwave and Retrowave, and our social media in the top bar',
        notes: [
            ['new', 'Two more custom backgrounds for the host (Room settings → Background): Synthwave and Retrowave. Also 1600 x 900 pictures: public/backgrounds/synthwave.png and retrowave.png.'],
            ['new', 'Synthwave is an outrun night: a huge striped sun going down, a ringed planet, neon wireframe mountains, searchlights that sweep the sky, a sports car on the horizon, palms in silhouette, a neon frame for the video and a glowing grid with a triangle under the booth.'],
            ['new', 'Retrowave is a hot 80s evening on the waterfront: a big sun behind an art deco skyline with lit windows, shapes floating in the sky, a boombox and an arcade machine, the video in a retro TV with a console, and a floor of light-up tiles with a vinyl record under the booth.'],
            ['improved', 'The top bar of a room shows our social media (Discord, YouTube and so on) as small icons where the Room info button was. Room info is in More, in the bar at the bottom.'],
        ],
    },
    {
        version: '1.16',
        title: 'Winter, Spring and Summer rooms',
        notes: [
            ['new', 'Three more custom backgrounds, for the host to pick in Room settings → Background (next to Halloween and Christmas): Winter, Spring and Summer. Each is a 1600 x 900 picture too: public/backgrounds/winter.png, spring.png and summer.png.'],
            ['new', 'Winter is the hour after sunset in the mountains: a low sun and a pale moon, pink ridges, a gondola across the sky, an igloo, an ice-fishing hut, a fox on the run, a frosty frame for the video, and a frozen lake with an ice rose under the booth. Snow falls over the room.'],
            ['new', 'Spring is a bright morning after the rain: a rainbow behind the screen, a hot-air balloon drifting by, a windmill turning, cottages on green hills, two cherry trees in blossom, a rose arch with the name, a trellis with ivy and bunting round the video, and a lawn with a ring of daisies. Butterflies flutter and blossom falls over the room.'],
            ['new', 'Summer is a day at the beach: a big sun with turning rays, gulls, a sailboat and a lighthouse on the sea, a lifeguard tower and a beach umbrella, crossed surfboards with the name, palms that sway, a crab running along the sand, a bamboo frame with lanterns and hibiscus, and a boardwalk with a sun painted under the booth.'],
        ],
    },
    {
        version: '1.15',
        title: 'A Christmas room, and backgrounds only the host can pick',
        notes: [
            ['new', 'A Christmas background for rooms (Room settings → Background): a snowy night with northern lights, a full moon with Santa\'s sleigh and reindeer across it, a big decorated tree, a log cabin with Santa stuck in the chimney, a snowman, a candy cane gate with SFD-DJ.EU on it, and the video in a frame of fairy lights and icicles. A snowflake glows on the floor under the DJ booth.'],
            ['new', 'While a song plays the lights twinkle, the sleigh flies across the sky, Santa kicks his legs, the northern lights shimmer, a shooting star passes now and then, and snow falls over the whole room, the crowd too (but not over the video). It is also a 1600 x 900 picture: public/backgrounds/christmas.png.'],
            ['new', 'Halloween and Christmas are custom backgrounds, and so will the next ones be. Only the host of a room sees them and can pick them: they have a box of their own, with a star, under the colour schemes in Room settings. Managers and others who can change the settings still choose between the six colour schemes, and everyone in the room sees what the host picked.'],
        ],
    },
    {
        version: '1.14',
        title: 'New playlists, footbar and top bar',
        notes: [
            ['new', 'Playlists look new: your lists on the left, the selected one on the right with its tracks, a search and paste bar, pages of 50, a menu on every track, and buttons to search in the list, rename, shuffle, import links, download the links and delete.'],
            ['new', 'Drag the tracks into the order they should play in. Every track also has Move to the top and Move to the bottom in its menu.'],
            ['new', 'One playlist is your active playlist. The footbar of a room shows it with your next track, and you can change it there. Join Waitlist queues the next track, and when it has been played it goes to the bottom of the list.'],
            ['new', 'The footbar is new: volume, active playlist, next track, how far the song is, and buttons for the playlists, the video, skip and More (room info, links and the donation goal). It makes itself smaller when the room is narrow.'],
            ['new', 'The top bar of a room has a way out (the arrow), the name of the room with how many are listening, who is playing what with their picture, and Room info.'],
            ['new', 'The menu on the left has the name of the room as a heading, Room (the page you are on) and Leave Room, which takes you to the Dashboard.'],
            ['new', 'The home page lists our partners: Borealise, club.dj and cord.dj.'],
            ['improved', 'The name of the video\'s channel is saved with every song you add.'],
        ],
    },
    {
        version: '1.13',
        title: 'Halloween, and only real avatars',
        notes: [
            ['new', 'A Halloween background for rooms (Room settings → Background): a haunted house on a hill, a graveyard behind an iron gate, a full moon, bats, ghosts and pumpkins, and a magic circle on the floor under the DJ booth. The lights, lanterns, fog and bats move while a song plays. It is also a 1600 x 900 picture: public/backgrounds/halloween.png.'],
            ['improved', 'The Avatar shop only has avatars that move and characters now. The plain emoji avatars are gone from the shop (an emoji you picked before is still shown).'],
        ],
    },
    {
        version: '1.12',
        title: 'Join and Leave Waitlist',
        notes: [
            ['new', 'A card to the left of the DJ booth: Join Waitlist (blue) when you are not in the line, Leave Waitlist (orange) when you are waiting or at the decks. It says how long it is until your song plays.'],
            ['new', 'While nobody is playing, the booth has a Waiting for DJ button that does the same as Join Waitlist.'],
            ['improved', 'A locked waitlist shows on the card, and the card shrinks to fit a narrow window.'],
        ],
    },
    {
        version: '1.11',
        title: 'New Woot, Grab and Meh',
        notes: [
            ['new', 'Woot, Grab and Meh are three cards in a row to the right of the DJ booth: a dark head with the icon and the name, and a green, purple or red body with the total. The ones you pressed light up.'],
            ['improved', 'In a narrow window the cards shrink to stay inside the room.'],
        ],
    },
    {
        version: '1.10',
        title: 'Staff characters',
        notes: [
            ['new', 'Thirteen new characters for Brand Ambassadors and everybody above them (Lead Moderator, Admin, Developer, Owner): eight astronauts in four colours (Ice, Azure, Sun and Nebula, each in a standard and a slim Mini build), Fedora with his boombox, the DJs Blaze and Echo, and their referee-shirt versions Blaze Ref and Echo Ref.'],
            ['new', 'They have their own Staff shelf in the Avatar shop, and everybody sees them in a room. They stand, dance when you press Woot or Grab, and DJ on the stage like all the others.'],
            ['improved', 'An avatar for a role goes when the role does, so it always stays with the people it was made for.'],
        ],
    },
    {
        version: '1.9',
        title: 'Characters that stand, dance and DJ',
        notes: [
            ['new', 'Characters: whole people for an avatar. Foxy, Neko, Bun, Panda, Wolfie and Robo are in the Avatar shop (use the Characters filter) and unlock with your level.'],
            ['new', 'In a room everybody stands until they press Woot or Grab, and then they dance. Press Meh and you stand again. The DJ dances on the stage for the whole song.'],
            ['new', 'Every character has three pictures that move: Standing, Dancing and DJing. The Avatar shop shows all three.'],
            ['new', 'Settings → Appearance → Always play animations keeps the dancing and the avatars moving even if your computer is set to reduce motion (on Windows that is Animation effects).'],
            ['improved', 'The DJ\'s name shows above the crowd when the mouse is on them.'],
        ],
    },
    {
        version: '1.8',
        title: 'The room is a club',
        notes: [
            ['new', 'A new look for every room: a club with the video on a big screen, the DJ booth in the middle and a dance floor.'],
            ['new', 'Whoever is playing stands in front of the booth, faces the room and dances. Woot, Grab and Meh are right next to the booth.'],
            ['new', 'Everybody in the room is on the dance floor and dances while a song plays. Click anyone for their quick profile.'],
            ['new', 'Six colour schemes for the club, picked in Room settings: Default, Midnight, Sunset, Neon, Forest and Club.'],
            ['improved', 'The video screen hangs right under the top bar, and the dance floor goes on to the bottom of the window.'],
            ['improved', 'Guests who only watch a room see the DJ too.'],
        ],
    },
    {
        version: '1.7',
        title: 'Site roles in a new order',
        notes: [
            ['new', 'The site roles are listed in three groups, from the highest down: Staff (Owner, Developer, Admin, Lead Moderator, Brand Ambassador, Moderator, Site Moderator, Helper, Promoter, Translator), Creator / Contributor and Community / Status.'],
            ['new', 'Lead Moderator is a new role, 🟣. Content Creator became Content Provider.'],
            ['improved', 'Every role has its own icon: it shows in front of the name in chat for anyone who was given the role, and in the admin Permissions, Users and role pickers.'],
            ['improved', 'The plain member is now called User.'],
        ],
    },
    {
        version: '1.6',
        title: 'Your card, a new Room info and avatars that move',
        notes: [
            ['new', 'A card under the logo with your picture, level and XP bar (for example 1,842 / 4,828 XP). Click it to open your profile.'],
            ['new', 'Animated avatars that loop: Spin, Ghost beat, Ember, Robo DJ, Neon cat and Fang. They are in the Avatar shop and unlock with your level.'],
            ['new', 'Upload your own animated GIF or WebP as your photo (up to 1 MB). It keeps moving.'],
            ['improved', 'Room info is new: the room banner, what is playing, listeners and songs played, the host, the room team, who is here, the rules as a list and a button to copy the room link.'],
            ['improved', 'Scrollbars are slim and quiet, and the menu on the left now fits small windows without a scrollbar.'],
            ['improved', 'Windows in a room look the same and close with Esc.'],
            ['improved', 'The Playlists button is gone from the bar at the bottom of a room. It is in the menu on the left.'],
        ],
    },
    {
        version: '1.5',
        title: 'Smarter chat menus',
        notes: [
            ['new', 'Point at a message and Reply, Copy and ⋯ buttons appear. The ⋯ menu (or a right-click) now also has Mention and Whisper, shows who wrote the message, and never gets cut off at the edge of the screen.'],
            ['new', 'Rest the mouse on a name or picture in chat for a short preview: level, XP bar, bio and stats.'],
            ['improved', 'The quick profile card has a new look: banner, level bar, four stats, favourite genre, whether the person is in the room, and big Whisper, Mention and Add friend buttons.'],
            ['improved', 'Moderation in the card shows who is muted and until when, with Mute, Kick and Ban as separate buttons.'],
            ['improved', 'Menus can be used with the keyboard: arrow keys to move, Esc to close.'],
        ],
    },
    {
        version: '1.4',
        title: 'The Avatar shop gets a studio',
        notes: [
            ['new', 'Try things on: pick an avatar, badge, accessory, frame and effect on a live preview, see how they look in chat, then save the whole look in one click.'],
            ['new', 'Over a hundred items, up from 47, in four rarities. Rarer ones unlock as you level up, and you can still try them on first.'],
            ['new', 'Animated frames (Aurora, Electric, Rainbow) and new glows (Storm, Void, Rainbow aura). Hats now sit on the head and accessories grow with the avatar.'],
            ['new', 'Your collection, a level bar that shows your next unlock, “Surprise me” and undo.'],
            ['fixed', 'Frames and effects were missing from the page styles in the finished site. They show everywhere now.'],
        ],
    },
    {
        version: '1.3',
        title: 'Settings, privacy and a new front door',
        notes: [
            ['new', 'Settings has a side menu, a live preview of your profile, a short bio and a favourite genre.'],
            ['new', 'Privacy: choose who may whisper you, whether people may send friend requests, and whether your online status is shown.'],
            ['new', 'Account: see every device you are logged in on and log the others out; download all your data as one file.'],
            ['new', 'Notifications: whisper pop-ups, mention highlights and optional browser notifications.'],
            ['new', 'Community: this week’s best songs, busiest DJs, rooms and chatters, a genre chart, the newest members and the team.'],
            ['new', 'Dashboard: today’s goals, “continue where you left off”, friends who are online, rooms picked for you and what is new.'],
            ['new', 'Log in and register have a new look: live username check, a password strength meter and the terms in one tick.'],
            ['improved', 'The home page shows a room preview, genres, the next event, top DJs and the latest news.'],
            ['new', 'A new logo: a record split by an S, with a dial that ends in a playhead. New tab icons, app icons, a share picture and a Brand page with downloads and colours.'],
        ],
    },
    {
        version: '1.2',
        title: 'Friends, events and a better admin panel',
        notes: [
            ['new', 'Friends: see who is online and in which room, people you may know, and search and filters.'],
            ['new', 'Events: a live countdown to the next event, who is going, and “Add to calendar”.'],
            ['new', 'Referral: share buttons, milestones, an inviter leaderboard and the friends you brought in.'],
            ['new', 'My Stuff: achievements, a security checklist, tabs and your equipped items on a live avatar.'],
            ['new', 'Admin panel: an overview with 14-day charts, recent signups and moderation, and a health check that tells you what is not set up (email, Reverb, API keys).'],
            ['new', 'Admin → Users: filters by role, bots and online, sorting, joined and last seen.'],
            ['improved', 'Whispers: search, unread filter, day headings, grouped messages and a friend picker.'],
            ['improved', 'FAQ with search and categories; Docs with search, a table of contents that follows you and copy buttons; Patch notes with filters.'],
        ],
    },
    {
        version: '1.1',
        title: 'A new look',
        notes: [
            ['new', 'A new public website: home, features, developers, pricing, about, contact and legal pages.'],
            ['new', 'Dashboard: level bar, your stats, live rooms with the song that is playing, search and filters, events, activity from friends, top DJs and your recent songs.'],
            ['improved', 'Softer, modern cards across the app, a new Community podium and a new My Stuff page.'],
            ['improved', 'The volume you set stays after a refresh, and the music keeps going without another click.'],
        ],
    },
    {
        version: '1.0',
        title: 'Developer API and roles',
        notes: [
            ['new', 'Public API (/api/v1) with tokens and bot accounts: build room bots, browser extensions and tools. Settings → Developers; npm package: sfddj.'],
            ['new', 'Admin panel → Users: a clear “Set role” button. Owners can now make other Owners.'],
            ['new', 'Permissions matrix: separate permissions for events and for the community links, new defaults, and a “Reset to recommended” button.'],
            ['improved', 'Social links and the donation goal are on the Community page for everyone to see; people with the right permission can edit them there.'],
            ['fixed', 'Banned or locked-out people could still post in a room by sending the request directly.'],
        ],
    },
    {
        version: '0.9',
        title: 'Quick profile',
        notes: [
            ['new', 'Click a name or picture in chat (or the ⋯ on a message) for a quick profile: view profile, mention, whisper, add friend, and for moderators mute, kick and ban.'],
            ['new', 'Everyone now has a public profile page with level, songs, woots, friends and their rooms.'],
            ['improved', 'Messages that mention your name are highlighted.'],
            ['fixed', 'The "friend request sent" notice in the user list showed no name.'],
        ],
    },
    {
        version: '0.8',
        title: 'Whispers, Discord and community links',
        notes: [
            ['new', 'Whispers: private messages between two people, live, also inside rooms and with /w username message.'],
            ['new', 'Link your Discord account in Settings → Account.'],
            ['new', 'Social links and a donation goal in the room footbar and on the dashboard.'],
            ['new', 'Live support chat on the login page, answered from the Admin panel.'],
            ['new', 'Log in with a username or an email; forgot-password mails and password-changed alerts.'],
            ['improved', 'The song timeline starts at 0:00 and ends at the song\'s length. Songs that ran past their end are finished automatically.'],
            ['fixed', 'The dashboard failed to open once any song had been played.'],
        ],
    },
    {
        version: '0.7',
        title: 'Look around freely',
        notes: [
            ['new', 'Guest mode: open the site, rooms, chat and community without an account.'],
            ['new', 'Events, FAQ, Patch notes and Docs pages.'],
            ['new', 'My Stuff: your rooms, playlists, recent songs, stats and shop items on one page.'],
            ['improved', 'Profile, My Stuff, Admin panel and Log out now live together at the bottom of the menu.'],
            ['improved', 'Rooms without a song now say “Waiting for the next DJ…”.'],
        ],
    },
    {
        version: '0.6',
        title: 'Room tools',
        notes: [
            ['new', 'Room settings in tabs: welcome message, rules, genre, privacy, waitlist lock and cycle.'],
            ['new', 'Give anyone a room role by searching their name.'],
            ['new', 'Moderation tabs: logs, banned, kicked and muted users.'],
            ['new', 'AutoMod filters for links, shouting, repeats and banned words.'],
            ['new', 'BetterTTV and 7TV emotes in chat.'],
        ],
    },
    {
        version: '0.5',
        title: 'Shop, friends and rooms',
        notes: [
            ['new', 'Avatar shop tabs: avatars, badges, accessories, frames and effects.'],
            ['new', 'Friends: tabs for friends, fans and requests, plus everyone who joined SFD-DJ.EU.'],
            ['new', 'Create rooms with a genre or make them private (staff only).'],
            ['new', 'Dashboard shows featured rooms and the rooms you created.'],
            ['improved', 'Password fields have a show/hide eye.'],
        ],
    },
    {
        version: '0.4',
        title: 'Playlists and a better chat',
        notes: [
            ['new', 'Your own playlists with YouTube, SoundCloud and Spotify links, plus import.'],
            ['new', 'History of every song that has been played.'],
            ['new', 'Now playing in the top bar and a footbar with volume and progress.'],
            ['new', 'Badges in front of names, and profile pictures you can upload.'],
            ['new', 'Chat: GIFs, pictures, stickers, emojis, room emojis and replies.'],
            ['fixed', 'Chat messages showed everyone as Member; roles now show correctly.'],
        ],
    },
    {
        version: '0.3',
        title: 'Roles and administration',
        notes: [
            ['new', 'Room roles (Host, Co-Host, Manager, Bouncer, Resident DJ) and custom roles.'],
            ['new', 'Admin panel: users, permission matrix, broadcast, IP bans and maintenance mode.'],
            ['new', 'Settings: profile, account, appearance, audio, notifications and violations.'],
            ['new', 'Woot, meh and grab, kicks and bans, system messages in chat.'],
        ],
    },
    {
        version: '0.2',
        title: 'Community',
        notes: [
            ['new', 'XP, levels, leaderboards and referrals.'],
            ['new', 'Site roles from Owner down to Member.'],
            ['new', 'Email verification and two-factor login.'],
        ],
    },
    {
        version: '0.1',
        title: 'First rooms',
        notes: [
            ['new', 'Rooms with live chat, a waitlist and synchronised YouTube playback.'],
            ['new', 'Dark theme, profiles and a dashboard.'],
        ],
    },
];

/** The version the site is at now: the newest release above. The chat of a room says it in its first line. */
export const VERSION = releases[0].version;
