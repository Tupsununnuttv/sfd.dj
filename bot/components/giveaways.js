import { MessageFlags } from 'discord.js';
import { botSettings, updateGuildSetting } from '../lib/settings.js';

export const buttons = [
    {
        id: 'giveaway:enter',
        async execute(interaction) {
            const giveaways = [...(botSettings[interaction.guildId]?.giveaways ?? [])];
            const giveaway = giveaways.find((entry) => entry.messageId === interaction.message.id && entry.active);
            if (!giveaway || Date.parse(giveaway.endsAt) <= Date.now()) {
                await interaction.reply({ content: 'This giveaway is closed.', flags: MessageFlags.Ephemeral });

                return;
            }
            if (giveaway.entries.includes(interaction.user.id)) {
                await interaction.reply({ content: 'You are already entered in this giveaway.', flags: MessageFlags.Ephemeral });

                return;
            }

            giveaway.entries.push(interaction.user.id);
            await updateGuildSetting(interaction.guildId, 'giveaways', giveaways);
            await interaction.reply({ content: `You entered the giveaway for ${giveaway.prize}!`, flags: MessageFlags.Ephemeral });
        },
    },
];
