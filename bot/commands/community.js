import { ChannelType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { requireManager } from '../lib/permissions.js';
import { botSettings, updateGuildSetting } from '../lib/settings.js';

const permission = 'configure community announcements';

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('boost-set')
            .setDescription('Set the server-boost announcement channel')
            .addChannelOption((option) => option.setName('channel').setDescription('Where new boosts are announced').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)),
        async execute(interaction) {
            if (!await requireManager(interaction, permission)) {
                return;
            }

            const channel = interaction.options.getChannel('channel', true);
            await updateGuildSetting(interaction.guildId, 'boostChannelId', channel.id);
            await interaction.reply({ content: `Boost announcements are set to ${channel}.`, flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('boost-clear')
            .setDescription('Disable server-boost announcements'),
        async execute(interaction) {
            if (!await requireManager(interaction, permission)) {
                return;
            }

            await updateGuildSetting(interaction.guildId, 'boostChannelId', null);
            await interaction.reply({ content: 'Boost announcements are disabled.', flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('birthday-channel')
            .setDescription('Set the opt-in birthday announcement channel')
            .addChannelOption((option) => option.setName('channel').setDescription('Where birthdays are announced').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)),
        async execute(interaction) {
            if (!await requireManager(interaction, permission)) {
                return;
            }

            const channel = interaction.options.getChannel('channel', true);
            await updateGuildSetting(interaction.guildId, 'birthdayChannelId', channel.id);
            await interaction.reply({ content: `Birthday announcements are set to ${channel}.`, flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('birthday-set')
            .setDescription('Opt in to birthday announcements')
            .addIntegerOption((option) => option.setName('month').setDescription('Birth month').setMinValue(1).setMaxValue(12).setRequired(true))
            .addIntegerOption((option) => option.setName('day').setDescription('Birth day').setMinValue(1).setMaxValue(31).setRequired(true)),
        async execute(interaction) {
            const birthdays = { ...(botSettings[interaction.guildId]?.birthdays ?? {}) };
            const month = interaction.options.getInteger('month', true);
            const day = interaction.options.getInteger('day', true);
            const date = new Date(Date.UTC(2000, month - 1, day));
            if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
                await interaction.reply({ content: 'That month and day are not a valid date.', flags: MessageFlags.Ephemeral });

                return;
            }

            birthdays[interaction.user.id] = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            await updateGuildSetting(interaction.guildId, 'birthdays', birthdays);
            await interaction.reply({ content: 'Birthday saved with no birth year. You can opt out any time with /birthday-clear.', flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('birthday-clear')
            .setDescription('Remove your birthday and opt out of announcements'),
        async execute(interaction) {
            const birthdays = { ...(botSettings[interaction.guildId]?.birthdays ?? {}) };
            delete birthdays[interaction.user.id];
            await updateGuildSetting(interaction.guildId, 'birthdays', birthdays);
            await interaction.reply({ content: 'Your birthday was removed. You are opted out of birthday announcements.', flags: MessageFlags.Ephemeral });
        },
    },
];
