import { ChannelType, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { requireManager } from '../lib/permissions.js';
import { updateGuildSetting } from '../lib/settings.js';
import { closeTicket, ticketModal, ticketPanel } from '../services/tickets.js';

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('ticket-setup')
            .setDescription('Configure private support tickets')
            .addChannelOption((option) => option.setName('category').setDescription('Category for private ticket channels').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
            .addChannelOption((option) => option.setName('log_channel').setDescription('Where ticket open and close events are logged').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true))
            .addRoleOption((option) => option.setName('staff_role').setDescription('Role that can read and close tickets').setRequired(true)),
        async execute(interaction) {
            if (!await requireManager(interaction, 'configure support tickets')) {
                return;
            }

            const staffRole = interaction.options.getRole('staff_role');
            await updateGuildSetting(interaction.guildId, 'tickets', {
                categoryId: interaction.options.getChannel('category', true).id,
                logChannelId: interaction.options.getChannel('log_channel', true).id,
                staffRoleId: staffRole?.id || null,
            });
            await interaction.reply({ content: 'Support tickets are configured. Use /ticket-panel to post the open-ticket button.', flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('ticket-panel')
            .setDescription('Post the support ticket button')
            .addChannelOption((option) => option.setName('channel').setDescription('Channel for the ticket button').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)),
        async execute(interaction) {
            if (!await requireManager(interaction, 'post the ticket panel')) {
                return;
            }

            const channel = interaction.options.getChannel('channel', true);
            await channel.send({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle('Need help?').setDescription('Open a private ticket and the SFD-DJ.EU staff team will help you.')], components: [ticketPanel] });
            await interaction.reply({ content: `Ticket panel posted in ${channel}.`, flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('ticket')
            .setDescription('Open a private support ticket'),
        async execute(interaction) {
            await interaction.showModal(ticketModal());
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('ticket-close')
            .setDescription('Close the current support ticket')
            .addStringOption((option) => option.setName('reason').setDescription('Optional closing note').setMaxLength(300)),
        async execute(interaction) {
            await closeTicket(interaction, interaction.options.getString('reason') || 'No reason provided.');
        },
    },
];
