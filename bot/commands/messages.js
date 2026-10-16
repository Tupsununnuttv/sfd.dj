import { ChannelType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { requireManager } from '../lib/permissions.js';
import { updateGuildSetting } from '../lib/settings.js';

const permission = 'configure bot messages';
const names = { welcome: 'Welcome', leave: 'Leave' };

/** /welcome-set and /leave-set are the same command for two kinds of message, and so are /welcome-clear and /leave-clear. */
const pair = (type, where) => [
    {
        data: new SlashCommandBuilder()
            .setName(`${type}-set`)
            .setDescription(`Set the ${type} channel and message`)
            .addChannelOption((option) => option.setName('channel').setDescription(`Where ${where} messages are sent`).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true))
            .addStringOption((option) => option.setName('message').setDescription('Use {user}, {username}, {server}, or {memberCount}').setMaxLength(1800).setRequired(true)),
        async execute(interaction) {
            if (!await requireManager(interaction, permission)) {
                return;
            }

            const channel = interaction.options.getChannel('channel', true);
            const message = interaction.options.getString('message', true);
            await updateGuildSetting(interaction.guildId, type, { channelId: channel.id, message });
            await interaction.reply({ content: `${names[type]} messages are now set in ${channel}. Use {user}, {username}, {server}, or {memberCount} in the message.`, flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName(`${type}-clear`)
            .setDescription(`Disable ${type} messages`),
        async execute(interaction) {
            if (!await requireManager(interaction, permission)) {
                return;
            }

            await updateGuildSetting(interaction.guildId, type, null);
            await interaction.reply({ content: `${names[type]} messages are disabled.`, flags: MessageFlags.Ephemeral });
        },
    },
];

export const commands = [...pair('welcome', 'welcome'), ...pair('leave', 'leave')];
