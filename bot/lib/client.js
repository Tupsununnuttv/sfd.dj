import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { presenceText } from '../config/index.js';

// "Listening to https://sfd-dj.eu/" under the bot's name, so everybody sees which site it belongs to
export const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    presence: { activities: [{ name: presenceText, type: ActivityType.Listening }] },
});
