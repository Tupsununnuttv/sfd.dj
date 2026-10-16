import { Events, REST, Routes } from 'discord.js';
import { guildId, token } from '../config/index.js';
import { commands } from '../commands/index.js';
import { botSettings, loadBotSettings } from '../lib/settings.js';
import { checkBirthdays } from '../services/birthdays.js';
import { settleDueGiveaways } from '../services/giveaways.js';
import { pollGithubReleases } from '../services/github.js';
import { pollWebsiteAnnouncements } from '../services/website.js';

/** The bot is online: read what the servers set up, catch up on what was missed, register the slash commands and start the timers. */
export const event = {
    name: Events.ClientReady,
    once: true,
    async execute(readyClient) {
        console.log(`Discord bot online as ${readyClient.user.tag}`);

        try {
            await loadBotSettings();
            await checkBirthdays();
            await settleDueGiveaways();
            for (const serverId of new Set([...Object.keys(botSettings), guildId])) {
                await pollWebsiteAnnouncements(serverId).catch((error) => console.error('Initial website announcement sync failed:', error.message));
                await pollGithubReleases(serverId);
            }
            const rest = new REST({ version: '10' }).setToken(token);
            await rest.put(Routes.applicationGuildCommands(readyClient.application.id, guildId), { body: commands.map((command) => command.data.toJSON()) });
            setInterval(() => checkBirthdays().catch((error) => console.error('Birthday check failed:', error.message)), 60_000).unref();
            setInterval(() => settleDueGiveaways().catch((error) => console.error('Giveaway check failed:', error.message)), 15_000).unref();
            setInterval(() => Object.keys(botSettings).forEach((serverId) => pollWebsiteAnnouncements(serverId).catch((error) => console.error('Website announcement poll failed:', error.message))), 60_000).unref();
            setInterval(() => Object.keys(botSettings).forEach((serverId) => pollGithubReleases(serverId)), 300_000).unref();
            console.log(`Registered ${commands.length} Discord commands in guild ${guildId}`);
        } catch (error) {
            console.error('Could not load bot settings or register Discord commands:', error.message);
        }
    },
};
