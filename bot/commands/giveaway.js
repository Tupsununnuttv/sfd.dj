import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { requireManager } from '../lib/permissions.js';
import { botSettings, updateGuildSetting } from '../lib/settings.js';
import { endGiveaway } from '../services/giveaways.js';

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('giveaway-start')
            .setDescription('Start a server giveaway')
            .addStringOption((option) => option.setName('prize').setDescription('What is being given away?').setMaxLength(200).setRequired(true))
            .addIntegerOption((option) => option.setName('minutes').setDescription('How long entries stay open').setMinValue(1).setMaxValue(10080).setRequired(true))
            .addIntegerOption((option) => option.setName('winners').setDescription('Number of winners').setMinValue(1).setMaxValue(10).setRequired(true)),
        async execute(interaction) {
            if (!await requireManager(interaction, 'start giveaways')) {
                return;
            }

            const prize = interaction.options.getString('prize', true);
            const minutes = interaction.options.getInteger('minutes', true);
            const winnerCount = interaction.options.getInteger('winners', true);
            const endsAt = Date.now() + minutes * 60_000;
            const embed = new EmbedBuilder()
                .setColor(0xf59e0b)
                .setTitle('Giveaway')
                .setDescription(`Prize: **${prize}**\nClick the button to enter.\nEnds <t:${Math.floor(endsAt / 1000)}:R>.`)
                .setFooter({ text: `${winnerCount} winner${winnerCount === 1 ? '' : 's'}` });
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('giveaway:enter').setLabel('Enter giveaway').setStyle(ButtonStyle.Success));
            const message = await interaction.channel.send({ embeds: [embed], components: [row] });
            const giveaways = [...(botSettings[interaction.guildId]?.giveaways ?? []), {
                messageId: message.id,
                channelId: message.channelId,
                prize,
                winnerCount,
                endsAt: new Date(endsAt).toISOString(),
                entries: [],
                active: true,
            }];
            await updateGuildSetting(interaction.guildId, 'giveaways', giveaways.slice(-100));
            await interaction.reply({ content: `Giveaway started in ${interaction.channel}.`, flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('giveaway-end')
            .setDescription('End a giveaway early')
            .addStringOption((option) => option.setName('message_id').setDescription('Giveaway message ID').setRequired(true)),
        async execute(interaction) {
            if (!await requireManager(interaction, 'end giveaways')) {
                return;
            }

            const messageId = interaction.options.getString('message_id', true);
            const winners = await endGiveaway(interaction.guildId, messageId, interaction.user.tag);
            await interaction.reply({ content: winners ? `Giveaway ended. Winner${winners.length === 1 ? '' : 's'}: ${winners.length ? winners.map((winner) => `<@${winner}>`).join(', ') : 'no valid entries'}.` : 'No active giveaway was found for that message ID.', flags: MessageFlags.Ephemeral });
        },
    },
];
