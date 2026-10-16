import { Events, MessageFlags } from 'discord.js';
import { buttons, handlerFor, modals } from '../components/index.js';
import { commandsByName } from '../commands/index.js';

/** Somebody used a slash command, a button or a form: find the handler and run it. Whatever goes wrong, the person is told so. */
export const event = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                await commandsByName.get(interaction.commandName)?.execute(interaction);
            } else if (interaction.isModalSubmit()) {
                await handlerFor(modals, interaction.customId)?.execute(interaction);
            } else if (interaction.isButton()) {
                await handlerFor(buttons, interaction.customId)?.execute(interaction);
            }
        } catch (error) {
            console.error('Discord interaction failed:', error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Something went wrong. Please try again or contact an administrator.', flags: MessageFlags.Ephemeral }).catch(() => {});
            }
        }
    },
};
