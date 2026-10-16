// Every Discord event the bot listens to. A file exports `event`: { name, once?, execute(...) }.
import { event as guildMemberAdd } from './guildMemberAdd.js';
import { event as guildMemberRemove } from './guildMemberRemove.js';
import { event as guildMemberUpdate } from './guildMemberUpdate.js';
import { event as interactionCreate } from './interactionCreate.js';
import { event as ready } from './ready.js';

export const events = [ready, guildMemberAdd, guildMemberRemove, guildMemberUpdate, interactionCreate];
