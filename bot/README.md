# SFD-DJ.EU Discord bot

The bot of the SFD-DJ.EU Discord server: support tickets, staff applications, giveaways, birthdays, welcome and leave messages, boost thanks, moderation, partner and info posts,
and the website's announcements and GitHub releases in a channel. It is its own Node project: its packages (discord.js) are installed in this folder, not in the website's.

Under its name Discord shows **Listening to https://sfd-dj.eu/**. Only a public address counts for that and for every link the bot sends: `localhost`, private networks and an unfilled
`${APP_URL}` are ignored, so a bot started on a PC never says "localhost:8000".

## Run it

```
cd bot
npm install      # once: installs discord.js into bot/node_modules
npm start        # or: npm run dev   (restarts when a file changes)
npm test         # the bot's own checks; nothing logs in to Discord
```

From the website's folder the same is `npm run bot:install`, `npm run bot:start` and `npm run bot:dev`. `start-dev.bat` (which runs the whole site) starts the bot too.

## Settings

The bot reads `DISCORD_BOT_TOKEN` and `DISCORD_GUILD_ID` (needed) and a few more (see `.env.example`). A real environment variable wins; after that the first file that names it:
`bot/.env`, then the website's `.env` one folder up (which already has them, so nothing has to be copied). Never put the token in git.

What the servers set up (tickets, welcome messages, giveaways, birthdays, partners, info posts, feeds) is saved in `data/settings.json`. It is not in git. The first time the bot starts it
copies the old file `storage/app/discord-bot-settings.json` there (the old one stays where it is).

## What is where

```
bot/
├── index.js            starts the bot: loads the events, logs in
├── config/             env.js (reads the .env files) and index.js (every setting, and the public site address)
├── lib/                client.js (the discord.js client and its status), settings.js (the settings file), permissions.js (who may set the bot up)
├── commands/           one file per kind of slash command, index.js lists them (29 commands)
├── components/         what the buttons and forms (modals) do: tickets, staff applications, giveaways, info posts
├── events/             what happens when the bot is ready, somebody joins, leaves or boosts, or uses something
├── services/           the work behind them: tickets, applications, giveaways, birthdays, announcements, GitHub releases, info posts, moderation log, welcome messages
├── test/               node --test
└── data/               settings.json (made when the bot runs; not in git)
```

To add a command: make a file in `commands/` that exports `commands = [{ data: new SlashCommandBuilder()…, async execute(interaction) {…} }]` and list it in `commands/index.js`.
It is registered in the server when the bot starts. A button or form is the same in `components/` (`{ id, execute }`, or `{ prefix, execute }` for ids that start the same).

## Staff applications

An application lives on the website (database, Admin → Applications), whether it was sent there or with `/apply`. The bot only carries the Discord side:

- `/apply` asks the website for the 15 questions (`GET /api/discord/staff-application-form`), so the forms here always match the page. Discord forms hold five questions, so it is four forms in a row
  with a Continue button between them; the Discord username is not asked. Questions that allow the person's own words (age group, time in the server) get an Other choice and an optional box under the select. The answers are kept in memory until the last form (an hour), then sent to the website (`POST /api/discord/staff-applications`).
  If the website does not answer, a Try sending again button keeps them.
- The website posts each application to `DISCORD_STAFF_APPLICATIONS_CHANNEL_ID` and keeps the message current. Under it the bot answers **Approve**, **Under review**, **Reject** (staff role or Manage Server
  only; they go to `PATCH /api/discord/staff-applications/<id>`, and the website gives the accepted applicant `DISCORD_APPROVED_STAFF_ROLE_ID` if their Discord is linked) and **Full answers**
  (all questions and answers as a text file). A decision made on the website updates the same message.
- The bot calls the live site (see above), with its token as the key. The website needs `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_STAFF_APPLICATIONS_CHANNEL_ID` and `DISCORD_APPROVED_STAFF_ROLE_ID`
  in its own `.env`; the bot itself no longer reads the channel and role settings.

## Commands

`/apply`, `/ticket`, `/ticket-setup`, `/ticket-panel`, `/ticket-close`, `/info` (add, edit, delete, post, list), `/welcome-set`, `/welcome-clear`, `/leave-set`, `/leave-clear`,
`/kick`, `/ban`, `/unban`, `/status`, `/profile`, `/boost-set`, `/boost-clear`, `/birthday-channel`, `/birthday-set`, `/birthday-clear`, `/partner-add`, `/partner-remove`, `/partners`,
`/giveaway-start`, `/giveaway-end`, `/updates-set`, `/updates-clear`, `/github-track`, `/github-untrack`. Server managers (and the staff role) set things up; everybody can use `/apply`, `/ticket`, `/profile`,
`/status`, `/partners` and the birthday commands.
