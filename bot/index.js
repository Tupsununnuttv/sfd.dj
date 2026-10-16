// The SFD-DJ.EU Discord bot. Start it with `npm start` in this folder (or `npm run bot:start` in the website's folder); see README.md for the rest.
import process from 'node:process';
import { guildId, token } from './config/index.js';
import { events } from './events/index.js';
import { client } from './lib/client.js';

if (!token || !guildId) {
    console.error('Discord bot is not configured. Set DISCORD_BOT_TOKEN and DISCORD_GUILD_ID in .env.');
    process.exitCode = 1;
} else {
    for (const event of events) {
        client[event.once ? 'once' : 'on'](event.name, (...args) => event.execute(...args));
    }

    client.login(token).catch((error) => {
        console.error('Discord bot could not log in:', error.message);
        process.exitCode = 1;
    });
}
