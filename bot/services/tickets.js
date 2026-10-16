import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    MessageFlags,
    ModalBuilder,
    PermissionFlagsBits,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { client } from '../lib/client.js';
import { canManageBot, roleIdsFor } from '../lib/permissions.js';
import { botSettings } from '../lib/settings.js';

/** The form a ticket starts from. */
export const ticketModal = () => new ModalBuilder()
    .setCustomId('ticket:submit')
    .setTitle('Contact SFD-DJ.EU staff')
    .addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder()
            .setCustomId('subject')
            .setLabel('What do you need help with?')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder()
            .setCustomId('details')
            .setLabel('Give us a few details')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(900)
            .setRequired(true)),
    );

/** The button inside a ticket that closes it. */
export const ticketActions = (ownerId) => new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId(`ticket:close:${ownerId}`)
        .setLabel('Close ticket')
        .setStyle(ButtonStyle.Secondary),
);

/** The button of the ticket panel (/ticket-panel) that opens one. */
export const ticketPanel = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId('ticket:open')
        .setLabel('Open a support ticket')
        .setStyle(ButtonStyle.Primary),
);

export const ticketLog = async (guild, message) => {
    const channelId = botSettings[guild.id]?.tickets?.logChannelId;
    if (!channelId) {
        return;
    }

    try {
        const channel = await client.channels.fetch(channelId);
        if (channel?.isTextBased() && channel.isSendable()) {
            await channel.send({ content: message, allowedMentions: { parse: [] } });
        }
    } catch (error) {
        console.error('Could not write to the ticket log:', error.message);
    }
};

export const openTicket = async (interaction, subject, details) => {
    const ticketSettings = botSettings[interaction.guildId]?.tickets;
    if (!ticketSettings?.categoryId || !ticketSettings?.logChannelId) {
        await interaction.reply({ content: 'Support tickets are not configured yet. Ask a server manager to run /ticket-setup.', flags: MessageFlags.Ephemeral });

        return;
    }

    const existing = interaction.guild.channels.cache.find((channel) => channel.type === ChannelType.GuildText
        && channel.parentId === ticketSettings.categoryId
        && channel.topic?.includes(`sfd-ticket-owner=${interaction.user.id}`));
    if (existing) {
        await interaction.reply({ content: `You already have an open ticket: ${existing}`, flags: MessageFlags.Ephemeral });

        return;
    }

    const permissionOverwrites = [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] },
    ];
    if (ticketSettings.staffRoleId) {
        permissionOverwrites.push({ id: ticketSettings.staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
    }

    const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 90),
        type: ChannelType.GuildText,
        parent: ticketSettings.categoryId,
        topic: `sfd-ticket-owner=${interaction.user.id}; opened=${new Date().toISOString()}`,
        permissionOverwrites,
        reason: `Support ticket opened by ${interaction.user.tag}`,
    });

    await channel.send({
        content: `<@${interaction.user.id}>${ticketSettings.staffRoleId ? ` <@&${ticketSettings.staffRoleId}>` : ''}`,
        embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(subject).setDescription(details).setFooter({ text: `Opened by ${interaction.user.tag}` }).setTimestamp()],
        components: [ticketActions(interaction.user.id)],
        allowedMentions: { users: [interaction.user.id], roles: ticketSettings.staffRoleId ? [ticketSettings.staffRoleId] : [] },
    });
    await ticketLog(interaction.guild, `Opened ${channel} by ${interaction.user.tag} (${interaction.user.id}).`);
    await interaction.reply({ content: `Your private ticket is ready: ${channel}`, flags: MessageFlags.Ephemeral });
};

export const closeTicket = async (interaction, reason = 'No reason provided.') => {
    const channel = interaction.channel;
    const ownerId = channel?.topic?.match(/sfd-ticket-owner=(\d{17,20})/)?.[1];
    if (!ownerId) {
        await interaction.reply({ content: 'This channel is not a support ticket.', flags: MessageFlags.Ephemeral });

        return;
    }

    const ticketSettings = botSettings[interaction.guildId]?.tickets;
    const isOwner = interaction.user.id === ownerId;
    const isStaff = canManageBot(interaction) || (ticketSettings?.staffRoleId && roleIdsFor(interaction).includes(ticketSettings.staffRoleId));
    if (!isOwner && !isStaff) {
        await interaction.reply({ content: 'Only the ticket owner or staff can close this ticket.', flags: MessageFlags.Ephemeral });

        return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await channel.permissionOverwrites.edit(ownerId, { ViewChannel: false, SendMessages: false });
    await channel.setName(`closed-${channel.name}`.slice(0, 100));
    await channel.setTopic(`sfd-ticket-closed=${ownerId}; closed=${new Date().toISOString()}`);
    await channel.send({ embeds: [new EmbedBuilder().setColor(0x737373).setTitle('Ticket closed').setDescription(`Closed by ${interaction.user.tag}. ${reason}`).setTimestamp()] });
    await ticketLog(interaction.guild, `Closed #${channel.name} by ${interaction.user.tag} (${interaction.user.id}). Reason: ${reason}`);
    await interaction.editReply('Ticket closed and hidden from its opener. Staff can still review the channel.');
};
