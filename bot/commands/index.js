// Every slash command of the bot. A command file exports `commands`: a list of { data (the SlashCommandBuilder), execute(interaction) }.
import { commands as apply } from './apply.js';
import { commands as community } from './community.js';
import { commands as giveaway } from './giveaway.js';
import { commands as info } from './info.js';
import { commands as messages } from './messages.js';
import { commands as moderation } from './moderation.js';
import { commands as partners } from './partners.js';
import { commands as profile } from './profile.js';
import { commands as status } from './status.js';
import { commands as ticket } from './ticket.js';
import { commands as updates } from './updates.js';

export const commands = [...apply, ...info, ...messages, ...moderation, ...ticket, ...status, ...profile, ...community, ...partners, ...giveaway, ...updates];

export const commandsByName = new Map(commands.map((command) => [command.data.name, command]));
