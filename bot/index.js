import { existsSync } from 'node:fs';
import { randomInt } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
    ActionRowBuilder,
    ActivityType,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    Client,
    EmbedBuilder,
    Events,
    GatewayIntentBits,
    MessageFlags,
    ModalBuilder,
    PermissionFlagsBits,
    REST,
    Routes,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';

if (existsSync('.env')) {
    process.loadEnvFile();
}

// A real web address, or null (Node does not fill in "${APP_URL}" in .env files, so that would arrive as it is written).
const webAddress = (value) => (/^https?:\/\/\S+$/.test(value ?? '') ? value : null);
// The site this bot belongs to. Not APP_URL: on a PC that is http://localhost:8000, and on the host it can still be the laravel.cloud address.
const siteUrl = (webAddress(process.env.DISCORD_WEBSITE_URL) ?? 'https://sfd-dj.eu').replace(/\/+$/, '');
const token = process.env.DISCORD_BOT_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID || process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const memberRoleId = process.env.DISCORD_MEMBER_ROLE_ID;
const applicationsChannelId = process.env.DISCORD_STAFF_APPLICATIONS_CHANNEL_ID;
const staffRoleId = process.env.DISCORD_STAFF_ROLE_ID;
const approvedStaffRoleId = process.env.DISCORD_APPROVED_STAFF_ROLE_ID;
const modLogChannelId = process.env.DISCORD_MOD_LOG_CHANNEL_ID;
const staffApplicationRequirements = (process.env.DISCORD_STAFF_APPLICATION_REQUIREMENTS || '').split('|').map((value) => value.trim()).filter(Boolean);
const staffApplicationQuestions = {
    motivation: process.env.DISCORD_STAFF_QUESTION_MOTIVATION || 'Why do you want to join the staff team?',
    experience: process.env.DISCORD_STAFF_QUESTION_EXPERIENCE || 'What relevant experience do you have?',
    availability: process.env.DISCORD_STAFF_QUESTION_AVAILABILITY || 'When are you usually available?',
};
const settingsPath = fileURLToPath(new URL('../storage/app/discord-bot-settings.json', import.meta.url));

let botSettings = {};
let settingsWrite = Promise.resolve();

const loadBotSettings = async () => {
    try {
        botSettings = JSON.parse(await readFile(settingsPath, 'utf8'));
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }

        botSettings = {};
    }
};

const updateGuildSetting = async (guildId, setting, value) => {
    settingsWrite = settingsWrite.then(async () => {
        botSettings[guildId] ??= {};
        botSettings[guildId][setting] = value;
        await mkdir(dirname(settingsPath), { recursive: true });
        const temporaryPath = `${settingsPath}.${process.pid}.tmp`;
        await writeFile(temporaryPath, JSON.stringify(botSettings, null, 2), 'utf8');
        await rename(temporaryPath, settingsPath);
    });

    await settingsWrite;
};

const roleIdsFor = (interaction) => Array.isArray(interaction.member?.roles)
    ? interaction.member.roles
    : [...(interaction.member?.roles?.cache?.keys() ?? [])];

const canManageBot = (interaction) => interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    || (staffRoleId && roleIdsFor(interaction).includes(staffRoleId));

const infoCommand = new SlashCommandBuilder()
    .setName('info')
    .setDescription('Create and manage server information posts')
    .addSubcommand((subcommand) => subcommand.setName('add').setDescription('Create an info post')
        .addStringOption((option) => option.setName('id').setDescription('Short key, for example welcome or rules').setMaxLength(32).setRequired(true))
        .addStringOption((option) => option.setName('title').setDescription('Heading for the info post').setMaxLength(100).setRequired(true))
        .addChannelOption((option) => option.setName('channel').setDescription('Where the post will appear').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName('edit').setDescription('Edit an existing info post')
        .addStringOption((option) => option.setName('id').setDescription('Info post key').setMaxLength(32).setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName('delete').setDescription('Delete an info post and its published message')
        .addStringOption((option) => option.setName('id').setDescription('Info post key').setMaxLength(32).setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName('post').setDescription('Publish or update an info post')
        .addStringOption((option) => option.setName('id').setDescription('Info post key').setMaxLength(32).setRequired(true))
        .addChannelOption((option) => option.setName('channel').setDescription('Override the saved channel').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)))
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('List configured info posts'));

const moderationCommands = [
    infoCommand,
    new SlashCommandBuilder()
        .setName('welcome-set')
        .setDescription('Set the welcome channel and message')
        .addChannelOption((option) => option.setName('channel').setDescription('Where welcome messages are sent').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true))
        .addStringOption((option) => option.setName('message').setDescription('Use {user}, {username}, {server}, or {memberCount}').setMaxLength(1800).setRequired(true)),
    new SlashCommandBuilder()
        .setName('welcome-clear')
        .setDescription('Disable welcome messages'),
    new SlashCommandBuilder()
        .setName('leave-set')
        .setDescription('Set the leave channel and message')
        .addChannelOption((option) => option.setName('channel').setDescription('Where leave messages are sent').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true))
        .addStringOption((option) => option.setName('message').setDescription('Use {user}, {username}, {server}, or {memberCount}').setMaxLength(1800).setRequired(true)),
    new SlashCommandBuilder()
        .setName('leave-clear')
        .setDescription('Disable leave messages'),
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from this server')
        .addUserOption((option) => option.setName('member').setDescription('Member to kick').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('Reason shown in the audit log').setMaxLength(400)),
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from this server')
        .addUserOption((option) => option.setName('user').setDescription('User to ban').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('Reason shown in the audit log').setMaxLength(400)),
    new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user by Discord ID')
        .addStringOption((option) => option.setName('user_id').setDescription('Discord user ID').setMinLength(17).setMaxLength(20).setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('Reason shown in the audit log').setMaxLength(400)),
    new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Configure private support tickets')
        .addChannelOption((option) => option.setName('category').setDescription('Category for private ticket channels').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
        .addChannelOption((option) => option.setName('log_channel').setDescription('Where ticket open and close events are logged').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true))
        .addRoleOption((option) => option.setName('staff_role').setDescription('Role that can read and close tickets').setRequired(true)),
    new SlashCommandBuilder()
        .setName('ticket-panel')
        .setDescription('Post the support ticket button')
        .addChannelOption((option) => option.setName('channel').setDescription('Channel for the ticket button').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)),
    new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Open a private support ticket'),
    new SlashCommandBuilder()
        .setName('ticket-close')
        .setDescription('Close the current support ticket')
        .addStringOption((option) => option.setName('reason').setDescription('Optional closing note').setMaxLength(300)),
    new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check whether the SFD-DJ.EU website is responding'),
    new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Show your linked SFD-DJ.EU level and achievements'),
    new SlashCommandBuilder()
        .setName('boost-set')
        .setDescription('Set the server-boost announcement channel')
        .addChannelOption((option) => option.setName('channel').setDescription('Where new boosts are announced').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)),
    new SlashCommandBuilder()
        .setName('boost-clear')
        .setDescription('Disable server-boost announcements'),
    new SlashCommandBuilder()
        .setName('birthday-channel')
        .setDescription('Set the opt-in birthday announcement channel')
        .addChannelOption((option) => option.setName('channel').setDescription('Where birthdays are announced').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)),
    new SlashCommandBuilder()
        .setName('birthday-set')
        .setDescription('Opt in to birthday announcements')
        .addIntegerOption((option) => option.setName('month').setDescription('Birth month').setMinValue(1).setMaxValue(12).setRequired(true))
        .addIntegerOption((option) => option.setName('day').setDescription('Birth day').setMinValue(1).setMaxValue(31).setRequired(true)),
    new SlashCommandBuilder()
        .setName('birthday-clear')
        .setDescription('Remove your birthday and opt out of announcements'),
    new SlashCommandBuilder()
        .setName('partner-add')
        .setDescription('Add a community partnership')
        .addStringOption((option) => option.setName('name').setDescription('Partner name').setMaxLength(70).setRequired(true))
        .addStringOption((option) => option.setName('url').setDescription('Partner HTTPS website').setMaxLength(300).setRequired(true))
        .addStringOption((option) => option.setName('description').setDescription('Short description').setMaxLength(250)),
    new SlashCommandBuilder()
        .setName('partner-remove')
        .setDescription('Remove a community partnership')
        .addStringOption((option) => option.setName('name').setDescription('Partner name').setMaxLength(70).setRequired(true)),
    new SlashCommandBuilder()
        .setName('partners')
        .setDescription('Show community partners'),
    new SlashCommandBuilder()
        .setName('giveaway-start')
        .setDescription('Start a server giveaway')
        .addStringOption((option) => option.setName('prize').setDescription('What is being given away?').setMaxLength(200).setRequired(true))
        .addIntegerOption((option) => option.setName('minutes').setDescription('How long entries stay open').setMinValue(1).setMaxValue(10080).setRequired(true))
        .addIntegerOption((option) => option.setName('winners').setDescription('Number of winners').setMinValue(1).setMaxValue(10).setRequired(true)),
    new SlashCommandBuilder()
        .setName('giveaway-end')
        .setDescription('End a giveaway early')
        .addStringOption((option) => option.setName('message_id').setDescription('Giveaway message ID').setRequired(true)),
    new SlashCommandBuilder()
        .setName('updates-set')
        .setDescription('Set where website announcements are posted')
        .addChannelOption((option) => option.setName('channel').setDescription('Channel for SFD-DJ.EU updates').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)),
    new SlashCommandBuilder()
        .setName('updates-clear')
        .setDescription('Stop posting website announcements in this server'),
    new SlashCommandBuilder()
        .setName('github-track')
        .setDescription('Track releases from a public GitHub repository')
        .addStringOption((option) => option.setName('repository').setDescription('Repository in owner/name format').setMaxLength(100).setRequired(true))
        .addChannelOption((option) => option.setName('channel').setDescription('Where releases are posted').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)),
    new SlashCommandBuilder()
        .setName('github-untrack')
        .setDescription('Stop tracking GitHub releases')
        .addStringOption((option) => option.setName('repository').setDescription('Repository in owner/name format').setMaxLength(100).setRequired(true)),
];

const renderMemberMessage = (template, member) => template
    .replaceAll('{user}', `<@${member.id}>`)
    .replaceAll('{username}', member.user.username)
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{memberCount}', String(member.guild.memberCount));

const ticketModal = () => new ModalBuilder()
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

const ticketActions = (ownerId) => new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId(`ticket:close:${ownerId}`)
        .setLabel('Close ticket')
        .setStyle(ButtonStyle.Secondary),
);

const ticketPanel = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId('ticket:open')
        .setLabel('Open a support ticket')
        .setStyle(ButtonStyle.Primary),
);

if (!token || !applicationId || !guildId) {
    console.error('Discord bot is not configured. Set DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID in .env.');
    process.exitCode = 1;
} else {
    const applyCommand = new SlashCommandBuilder()
        .setName('apply')
        .setDescription('Apply to join the SFD-DJ.EU staff team');

    const applicationStartButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('staff-application:start').setLabel('Start application').setStyle(ButtonStyle.Primary),
    );

    // "Listening to sfd-dj.eu" under the bot's name, so everybody sees which site it belongs to
    const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
        presence: { activities: [{ name: siteUrl.replace(/^https?:\/\//, ''), type: ActivityType.Listening }] },
    });

    const sendMemberNotice = async (member, type) => {
        const settings = botSettings[member.guild.id]?.[type];
        if (!settings?.channelId || !settings?.message) {
            return;
        }

        const channel = await client.channels.fetch(settings.channelId);
        if (!channel?.isTextBased() || !channel.isSendable()) {
            console.warn(`The configured ${type} channel could not be reached.`);

            return;
        }

        await channel.send({
            content: renderMemberMessage(settings.message, member),
            allowedMentions: { parse: [], users: [member.id] },
        });
    };

    const sendModerationLog = async (action, actor, target, reason) => {
        if (!modLogChannelId) {
            return;
        }

        try {
            const channel = await client.channels.fetch(modLogChannelId);
            if (!channel?.isTextBased() || !channel.isSendable()) {
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(action === 'ban' ? 0xef4444 : action === 'kick' ? 0xf97316 : 0x22c55e)
                .setTitle(`Member ${action}`)
                .addFields(
                    { name: 'Target', value: target, inline: true },
                    { name: 'Moderator', value: `${actor.tag} (${actor.id})`, inline: true },
                    { name: 'Reason', value: reason || 'No reason provided.' },
                )
                .setTimestamp();

            await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
        } catch (error) {
            console.error('Could not send a moderation log:', error.message);
        }
    };

    const ticketLog = async (guild, message) => {
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

    const openTicket = async (interaction, subject, details) => {
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

    const closeTicket = async (interaction, reason = 'No reason provided.') => {
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

    const checkWebsiteStatus = async () => {
        const url = webAddress(process.env.DISCORD_STATUS_URL) ?? siteUrl;
        const started = Date.now();
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'follow' });

            return { url, ok: response.ok, status: response.status, elapsed: Date.now() - started };
        } catch (error) {
            return { url, ok: false, status: error.name === 'TimeoutError' ? 'timeout' : 'unreachable', elapsed: Date.now() - started };
        }
    };

    const announceBoost = async (member) => {
        const channelId = botSettings[member.guild.id]?.boostChannelId;
        if (!channelId) {
            return;
        }

        const channel = await client.channels.fetch(channelId);
        if (channel?.isTextBased() && channel.isSendable()) {
            await channel.send({
                embeds: [new EmbedBuilder().setColor(0xf47fff).setTitle('Server boosted!').setDescription(`Thank you, ${member}, for boosting **${member.guild.name}**!`).setThumbnail(member.user.displayAvatarURL()).setTimestamp()],
                allowedMentions: { users: [member.id] },
            });
        }
    };

    const checkBirthdays = async () => {
        const today = new Date().toISOString().slice(5, 10);
        for (const [serverId, settings] of Object.entries(botSettings)) {
            if (!settings.birthdayChannelId || settings.birthdaySentDate === today) {
                continue;
            }

            const birthdays = Object.entries(settings.birthdays ?? {}).filter(([, date]) => date === today).map(([userId]) => userId);
            if (birthdays.length > 0) {
                const channel = await client.channels.fetch(settings.birthdayChannelId).catch(() => null);
                if (!channel?.isTextBased() || !channel.isSendable()) {
                    continue;
                }

                const mentions = birthdays.map((userId) => `<@${userId}>`);
                await channel.send({
                    content: `Happy birthday, ${mentions.join(', ')}! 🎂`,
                    allowedMentions: { users: birthdays },
                });
            }

            await updateGuildSetting(serverId, 'birthdaySentDate', today);
        }
    };

    const endGiveaway = async (serverId, messageId, endedBy = 'Scheduled draw') => {
        const giveaways = botSettings[serverId]?.giveaways ?? [];
        const giveaway = giveaways.find((entry) => entry.messageId === messageId && entry.active);
        if (!giveaway) {
            return null;
        }

        giveaway.active = false;
        giveaway.endedAt = new Date().toISOString();
        const shuffledEntries = [...new Set(giveaway.entries)];
        for (let index = shuffledEntries.length - 1; index > 0; index--) {
            const swapIndex = randomInt(index + 1);
            [shuffledEntries[index], shuffledEntries[swapIndex]] = [shuffledEntries[swapIndex], shuffledEntries[index]];
        }
        const winners = shuffledEntries.slice(0, giveaway.winnerCount);
        giveaway.winners = winners;
        await updateGuildSetting(serverId, 'giveaways', giveaways);

        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
        const message = await channel?.messages.fetch(messageId).catch(() => null);
        if (message) {
            const winnerText = winners.length ? winners.map((winner) => `<@${winner}>`).join(', ') : 'No entries this time.';
            const embed = EmbedBuilder.from(message.embeds[0])
                .setColor(0x737373)
                .setTitle('Giveaway ended')
                .setDescription(`Prize: **${giveaway.prize}**\nWinner${winners.length === 1 ? '' : 's'}: ${winnerText}\nEnded by ${endedBy}.`);
            const disabledRow = new ActionRowBuilder().addComponents(
                ...message.components.flatMap((row) => row.components).map((button) => ButtonBuilder.from(button).setDisabled(true)),
            );
            await message.edit({ embeds: [embed], components: [disabledRow], allowedMentions: { users: winners } });
        }

        return winners;
    };

    const settleDueGiveaways = async () => {
        for (const [serverId, settings] of Object.entries(botSettings)) {
            const due = (settings.giveaways ?? []).filter((giveaway) => giveaway.active && Date.parse(giveaway.endsAt) <= Date.now());
            for (const giveaway of due) {
                await endGiveaway(serverId, giveaway.messageId);
            }
        }
    };

    const pollWebsiteAnnouncements = async (serverId) => {
        const settings = botSettings[serverId];
        if (!settings?.updatesChannelId) {
            return;
        }

        const cursor = settings.announcementsAfter;
        const endpoint = new URL('/api/discord/announcements', siteUrl);
        if (cursor !== undefined) {
            endpoint.searchParams.set('after', String(cursor));
        }

        const response = await fetch(endpoint, {
            headers: { Authorization: `Bot ${token}`, Accept: 'application/json' },
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) {
            throw new Error(`Announcement feed returned HTTP ${response.status}`);
        }

        const feed = await response.json();
        if (cursor === undefined) {
            await updateGuildSetting(serverId, 'announcementsAfter', feed.latest_id);

            return;
        }

        const channel = await client.channels.fetch(settings.updatesChannelId);
        if (!channel?.isTextBased() || !channel.isSendable()) {
            return;
        }

        for (const announcement of feed.announcements) {
            const warning = announcement.level === 'warning';
            await channel.send({
                embeds: [new EmbedBuilder()
                    .setColor(warning ? 0xf59e0b : 0x5865f2)
                    .setTitle(warning ? 'SFD-DJ.EU notice' : 'SFD-DJ.EU update')
                    .setURL(siteUrl)
                    .setDescription(String(announcement.message).slice(0, 3900))
                    .setTimestamp(new Date(announcement.created_at))],
                allowedMentions: { parse: [] },
            });
            await updateGuildSetting(serverId, 'announcementsAfter', announcement.id);
        }
    };

    const fetchLatestRelease = async (repository) => {
        const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
            headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'SFD-DJ.EU-Discord-Bot' },
            signal: AbortSignal.timeout(8000),
        });
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error(`GitHub returned HTTP ${response.status} for ${repository}`);
        }

        return response.json();
    };

    const pollGithubReleases = async (serverId) => {
        for (const repository of botSettings[serverId]?.githubRepositories ?? []) {
            try {
                const release = await fetchLatestRelease(repository.name);
                if (!release) {
                    continue;
                }
                if (repository.lastReleaseId === undefined) {
                    repository.lastReleaseId = release.id;
                    await updateGuildSetting(serverId, 'githubRepositories', botSettings[serverId].githubRepositories);

                    continue;
                }
                if (repository.lastReleaseId === release.id) {
                    continue;
                }

                const channel = await client.channels.fetch(repository.channelId);
                if (channel?.isTextBased() && channel.isSendable()) {
                    await channel.send({
                        embeds: [new EmbedBuilder()
                            .setColor(0x24292f)
                            .setTitle(`New release: ${release.name || release.tag_name}`)
                            .setURL(release.html_url)
                            .setDescription(String(release.body || 'A new release is available.').slice(0, 3900))
                            .addFields({ name: 'Repository', value: repository.name })
                            .setTimestamp(new Date(release.published_at || release.created_at))],
                        allowedMentions: { parse: [] },
                    });
                }

                repository.lastReleaseId = release.id;
                await updateGuildSetting(serverId, 'githubRepositories', botSettings[serverId].githubRepositories);
            } catch (error) {
                console.error(`Could not check GitHub releases for ${repository.name}:`, error.message);
            }
        }
    };

    const pendingInfoPages = new Map();

    const infoInput = (id, label, maxLength, required, value = '') => {
        const input = new TextInputBuilder()
            .setCustomId(id)
            .setLabel(label.slice(0, 45))
            .setStyle(id === 'body' ? TextInputStyle.Paragraph : TextInputStyle.Short)
            .setMaxLength(maxLength)
            .setRequired(required);
        if (value) {
            input.setValue(value.slice(0, maxLength));
        }

        return input;
    };

    const infoModal = (action, key, title, page, userId) => new ModalBuilder()
        .setCustomId(`info:save:${action}:${key}:${userId}`)
        .setTitle(`${action === 'add' ? 'Create' : 'Edit'} info: ${title}`.slice(0, 45))
        .addComponents(
            new ActionRowBuilder().addComponents(infoInput('title', 'Post title', 256, true, page.title || title)),
            new ActionRowBuilder().addComponents(infoInput('body', 'Post text', 4000, true, page.body || '')),
            new ActionRowBuilder().addComponents(infoInput('image_url', 'Optional banner image HTTPS URL', 500, false, page.imageUrl || '')),
            new ActionRowBuilder().addComponents(infoInput('button_label', 'Optional link button label', 80, false, page.buttonLabel || '')),
            new ActionRowBuilder().addComponents(infoInput('button_url', 'Optional link button HTTPS URL', 500, false, page.buttonUrl || '')),
        );

    const infoPagePayload = (page) => {
        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(page.title)
            .setDescription(page.body);
        if (page.imageUrl) {
            embed.setImage(page.imageUrl);
        }
        const components = page.buttonLabel && page.buttonUrl
            ? [new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(page.buttonLabel).setURL(page.buttonUrl))]
            : [];

        return { embeds: [embed], components };
    };

    const publishInfoPage = async (serverId, key, page, channelId = page.channelId) => {
        const channel = await client.channels.fetch(channelId);
        if (!channel?.isTextBased() || !channel.isSendable()) {
            throw new Error('The configured info channel cannot receive messages.');
        }

        let message = null;
        if (page.messageId && channelId === page.channelId) {
            message = await channel.messages.fetch(page.messageId).catch(() => null);
        }
        if (message) {
            await message.edit(infoPagePayload(page));
        } else {
            message = await channel.send(infoPagePayload(page));
        }

        const pages = { ...(botSettings[serverId]?.infoPages ?? {}), [key]: { ...page, channelId, messageId: message.id } };
        await updateGuildSetting(serverId, 'infoPages', pages);

        return message;
    };

    const applicationButtons = (applicationId, discordId) => new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`staff-application:approve:${applicationId}:${discordId}`)
            .setLabel('Approve')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`staff-application:reject:${applicationId}:${discordId}`)
            .setLabel('Reject')
            .setStyle(ButtonStyle.Danger),
    );

    const applicationModal = () => new ModalBuilder()
        .setCustomId('staff-application:submit')
        .setTitle('SFD-DJ.EU staff application')
        .addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder()
                .setCustomId('motivation')
                .setLabel(staffApplicationQuestions.motivation.slice(0, 45))
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(900)
                .setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder()
                .setCustomId('experience')
                .setLabel(staffApplicationQuestions.experience.slice(0, 45))
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(900)
                .setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder()
                .setCustomId('availability')
                .setLabel(staffApplicationQuestions.availability.slice(0, 45))
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(900)
                .setRequired(true)),
        );

    const sendApplication = async (interaction, answers, source) => {
        if (!applicationsChannelId) {
            await interaction.reply({ content: 'Staff applications are not configured yet.', flags: MessageFlags.Ephemeral });

            return;
        }

        const channel = await client.channels.fetch(applicationsChannelId);
        if (!channel?.isTextBased() || !channel.isSendable()) {
            await interaction.reply({ content: 'The staff applications channel could not be reached.', flags: MessageFlags.Ephemeral });

            return;
        }

        const applicationId = interaction.id;
        const requirements = staffApplicationRequirements.length ? `\n\nRequirements: ${staffApplicationRequirements.join('; ')}` : '';
        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('Staff application')
            .setDescription(`Submitted via ${source}.${requirements}`)
            .addFields(
                { name: 'Applicant', value: `${interaction.user} (${interaction.user.username})`, inline: true },
                { name: 'Discord ID', value: interaction.user.id, inline: true },
                { name: staffApplicationQuestions.motivation, value: answers.motivation },
                { name: staffApplicationQuestions.experience, value: answers.experience },
                { name: staffApplicationQuestions.availability, value: answers.availability },
            )
            .setTimestamp();

        await channel.send({ embeds: [embed], components: [applicationButtons(applicationId, interaction.user.id)] });
        await interaction.reply({ content: 'Your application has been sent to the staff team.', flags: MessageFlags.Ephemeral });
    };

    client.once(Events.ClientReady, async (readyClient) => {
        console.log(`Discord bot online as ${readyClient.user.tag}`);

        try {
            await loadBotSettings();
            await checkBirthdays();
            await settleDueGiveaways();
            for (const serverId of new Set([...Object.keys(botSettings), guildId])) {
                await pollWebsiteAnnouncements(serverId).catch((error) => console.error('Initial website announcement sync failed:', error.message));
                await pollGithubReleases(serverId);
            }
            const rest = new REST({ version: '10' }).setToken(token);
            await rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: [applyCommand, ...moderationCommands].map((command) => command.toJSON()) });
            setInterval(() => checkBirthdays().catch((error) => console.error('Birthday check failed:', error.message)), 60_000).unref();
            setInterval(() => settleDueGiveaways().catch((error) => console.error('Giveaway check failed:', error.message)), 15_000).unref();
            setInterval(() => Object.keys(botSettings).forEach((serverId) => pollWebsiteAnnouncements(serverId).catch((error) => console.error('Website announcement poll failed:', error.message))), 60_000).unref();
            setInterval(() => Object.keys(botSettings).forEach((serverId) => pollGithubReleases(serverId)), 300_000).unref();
            console.log(`Registered ${1 + moderationCommands.length} Discord commands in guild ${guildId}`);
        } catch (error) {
            console.error('Could not load bot settings or register Discord commands:', error.message);
        }
    });

    client.on(Events.GuildMemberAdd, async (member) => {
        if (memberRoleId) {
            try {
                await member.roles.add(memberRoleId, 'Automatic new member role');
                console.log(`Assigned member role to ${member.user.tag}`);
            } catch (error) {
                console.error(`Could not assign the member role to ${member.user.tag}:`, error.message);
            }
        } else {
            console.warn('DISCORD_MEMBER_ROLE_ID is not set; skipped the automatic member role.');
        }

        try {
            await sendMemberNotice(member, 'welcome');
        } catch (error) {
            console.error(`Could not send a welcome message for ${member.user.tag}:`, error.message);
        }
    });

    client.on(Events.GuildMemberRemove, async (member) => {
        try {
            await sendMemberNotice(member, 'leave');
        } catch (error) {
            console.error(`Could not send a leave message for ${member.user.tag}:`, error.message);
        }
    });

    client.on(Events.GuildMemberUpdate, async (before, after) => {
        if (!before.premiumSinceTimestamp && after.premiumSinceTimestamp) {
            try {
                await announceBoost(after);
            } catch (error) {
                console.error(`Could not announce ${after.user.tag}'s boost:`, error.message);
            }
        }
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        try {
            if (interaction.isChatInputCommand() && interaction.commandName === 'apply') {
                const requirements = staffApplicationRequirements.length
                    ? `Requirements:\n${staffApplicationRequirements.map((requirement) => `• ${requirement}`).join('\n')}`
                    : 'There are no additional requirements right now.';
                await interaction.reply({ content: `SFD-DJ.EU staff application\n${requirements}`, components: [applicationStartButton], flags: MessageFlags.Ephemeral });

                return;
            }

            if (interaction.isChatInputCommand() && interaction.commandName === 'info') {
                if (!canManageBot(interaction)) {
                    await interaction.reply({ content: 'You do not have permission to manage info posts.', flags: MessageFlags.Ephemeral });

                    return;
                }

                const action = interaction.options.getSubcommand();
                const key = interaction.options.getString('id');
                const pages = { ...(botSettings[interaction.guildId]?.infoPages ?? {}) };

                if (action === 'list') {
                    const entries = Object.entries(pages);
                    await interaction.reply({
                        content: entries.length
                            ? entries.map(([pageKey, page]) => `**${pageKey}**: ${page.title} · <#${page.channelId}> · ${page.messageId ? 'posted' : 'not posted'}`).join('\n').slice(0, 1900)
                            : 'No info posts are configured. Use `/info add` to create one.',
                        flags: MessageFlags.Ephemeral,
                    });

                    return;
                }

                if (!/^[a-z0-9_-]{1,32}$/.test(key)) {
                    await interaction.reply({ content: 'Use a short lowercase ID containing letters, numbers, hyphens, or underscores.', flags: MessageFlags.Ephemeral });

                    return;
                }

                if (action === 'delete') {
                    const page = pages[key];
                    if (!page) {
                        await interaction.reply({ content: `No info post exists with ID ${key}.`, flags: MessageFlags.Ephemeral });

                        return;
                    }
                    if (page.messageId) {
                        const channel = await client.channels.fetch(page.channelId).catch(() => null);
                        const message = await channel?.messages.fetch(page.messageId).catch(() => null);
                        await message?.delete().catch(() => {});
                    }
                    delete pages[key];
                    await updateGuildSetting(interaction.guildId, 'infoPages', pages);
                    await interaction.reply({ content: `Deleted info post ${key}.`, flags: MessageFlags.Ephemeral });

                    return;
                }

                if (action === 'post') {
                    const page = pages[key];
                    if (!page) {
                        await interaction.reply({ content: `No info post exists with ID ${key}.`, flags: MessageFlags.Ephemeral });

                        return;
                    }
                    const targetChannel = interaction.options.getChannel('channel')?.id || page.channelId;
                    const message = await publishInfoPage(interaction.guildId, key, page, targetChannel);
                    await interaction.reply({ content: `Info post ${message.url} is published.`, flags: MessageFlags.Ephemeral });

                    return;
                }

                if (action === 'add' && pages[key]) {
                    await interaction.reply({ content: `Info post ${key} already exists; use /info edit instead.`, flags: MessageFlags.Ephemeral });

                    return;
                }
                if (action === 'edit' && !pages[key]) {
                    await interaction.reply({ content: `No info post exists with ID ${key}.`, flags: MessageFlags.Ephemeral });

                    return;
                }

                const page = action === 'add'
                    ? { key, title: interaction.options.getString('title', true), channelId: interaction.options.getChannel('channel', true).id }
                    : pages[key];
                const modal = infoModal(action, key, page.title, page, interaction.user.id);
                pendingInfoPages.set(modal.data.custom_id, { serverId: interaction.guildId, key, page, action, authorId: interaction.user.id });
                await interaction.showModal(modal);

                return;
            }

            if (interaction.isChatInputCommand() && interaction.commandName === 'ticket-setup') {
                if (!canManageBot(interaction)) {
                    await interaction.reply({ content: 'You do not have permission to configure support tickets.', flags: MessageFlags.Ephemeral });

                    return;
                }

                const staffRole = interaction.options.getRole('staff_role');
                await updateGuildSetting(interaction.guildId, 'tickets', {
                    categoryId: interaction.options.getChannel('category', true).id,
                    logChannelId: interaction.options.getChannel('log_channel', true).id,
                    staffRoleId: staffRole?.id || null,
                });
                await interaction.reply({ content: 'Support tickets are configured. Use /ticket-panel to post the open-ticket button.', flags: MessageFlags.Ephemeral });

                return;
            }

            if (interaction.isChatInputCommand() && interaction.commandName === 'ticket-panel') {
                if (!canManageBot(interaction)) {
                    await interaction.reply({ content: 'You do not have permission to post the ticket panel.', flags: MessageFlags.Ephemeral });

                    return;
                }

                const channel = interaction.options.getChannel('channel', true);
                await channel.send({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle('Need help?').setDescription('Open a private ticket and the SFD-DJ.EU staff team will help you.')], components: [ticketPanel] });
                await interaction.reply({ content: `Ticket panel posted in ${channel}.`, flags: MessageFlags.Ephemeral });

                return;
            }

            if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {
                await interaction.showModal(ticketModal());

                return;
            }

            if (interaction.isChatInputCommand() && interaction.commandName === 'ticket-close') {
                await closeTicket(interaction, interaction.options.getString('reason') || 'No reason provided.');

                return;
            }

            if (interaction.isChatInputCommand() && interaction.commandName === 'status') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const status = await checkWebsiteStatus();
                const embed = new EmbedBuilder()
                    .setColor(status.ok ? 0x22c55e : 0xef4444)
                    .setTitle(status.ok ? 'SFD-DJ.EU is responding' : 'SFD-DJ.EU may be unavailable')
                    .setURL(status.url)
                    .addFields(
                        { name: 'HTTP', value: String(status.status), inline: true },
                        { name: 'Response time', value: `${status.elapsed} ms`, inline: true },
                    )
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });

                return;
            }

            if (interaction.isChatInputCommand() && interaction.commandName === 'profile') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const response = await fetch(`${siteUrl}/api/discord/members/${interaction.user.id}`, {
                    headers: { Authorization: `Bot ${token}`, Accept: 'application/json' },
                    signal: AbortSignal.timeout(8000),
                });

                if (response.status === 404) {
                    await interaction.editReply(`Your Discord account is not linked to an SFD-DJ.EU account yet. Connect it in Settings → Connections: ${siteUrl}/settings/connections`);

                    return;
                }
                if (!response.ok) {
                    await interaction.editReply('Could not read your SFD-DJ.EU profile right now. Please try again later.');

                    return;
                }

                const profile = await response.json();
                const completed = profile.achievements.filter((achievement) => achievement.done).map((achievement) => `${achievement.icon} ${achievement.title}`);
                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle(`${profile.user.name} (@${profile.user.username})`)
                    .addFields(
                        { name: 'Level', value: String(profile.user.level), inline: true },
                        { name: 'XP', value: String(profile.user.xp), inline: true },
                        { name: `Achievements (${completed.length}/${profile.achievements.length})`, value: completed.join('\n').slice(0, 1024) || 'No achievements yet.' },
                    );
                await interaction.editReply({ embeds: [embed] });

                return;
            }

            if (interaction.isChatInputCommand() && ['updates-set', 'updates-clear', 'github-track', 'github-untrack'].includes(interaction.commandName)) {
                if (!canManageBot(interaction)) {
                    await interaction.reply({ content: 'You do not have permission to configure update feeds.', flags: MessageFlags.Ephemeral });

                    return;
                }

                if (interaction.commandName === 'updates-clear') {
                    await updateGuildSetting(interaction.guildId, 'updatesChannelId', null);
                    await interaction.reply({ content: 'Website announcements are no longer posted in Discord.', flags: MessageFlags.Ephemeral });

                    return;
                }

                if (interaction.commandName === 'updates-set') {
                    const channel = interaction.options.getChannel('channel', true);
                    await updateGuildSetting(interaction.guildId, 'updatesChannelId', channel.id);
                    await pollWebsiteAnnouncements(interaction.guildId);
                    await interaction.reply({ content: `New SFD-DJ.EU announcements will be posted in ${channel}.`, flags: MessageFlags.Ephemeral });

                    return;
                }

                const repository = interaction.options.getString('repository', true).trim();
                if (!/^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(repository)) {
                    await interaction.reply({ content: 'Use the public GitHub repository format owner/name.', flags: MessageFlags.Ephemeral });

                    return;
                }

                const repositories = [...(botSettings[interaction.guildId]?.githubRepositories ?? [])];
                const existingIndex = repositories.findIndex((entry) => entry.name.toLowerCase() === repository.toLowerCase());
                if (interaction.commandName === 'github-untrack') {
                    if (existingIndex < 0) {
                        await interaction.reply({ content: 'That repository is not being tracked.', flags: MessageFlags.Ephemeral });

                        return;
                    }
                    repositories.splice(existingIndex, 1);
                    await updateGuildSetting(interaction.guildId, 'githubRepositories', repositories);
                    await interaction.reply({ content: `Stopped tracking ${repository}.`, flags: MessageFlags.Ephemeral });

                    return;
                }

                const channel = interaction.options.getChannel('channel', true);
                const latest = await fetchLatestRelease(repository);
                const subscription = { name: repository, channelId: channel.id, lastReleaseId: latest?.id ?? null };
                if (existingIndex >= 0) {
                    repositories[existingIndex] = subscription;
                } else {
                    repositories.push(subscription);
                }
                await updateGuildSetting(interaction.guildId, 'githubRepositories', repositories.slice(-20));
                await interaction.reply({ content: latest
                    ? `Tracking new releases from ${repository} in ${channel}. Existing releases will not be reposted.`
                    : `Tracking ${repository} in ${channel}. Updates will appear when its first release is published.`, flags: MessageFlags.Ephemeral });

                return;
            }

            if (interaction.isChatInputCommand() && ['boost-set', 'boost-clear', 'birthday-channel'].includes(interaction.commandName)) {
                if (!canManageBot(interaction)) {
                    await interaction.reply({ content: 'You do not have permission to configure community announcements.', flags: MessageFlags.Ephemeral });

                    return;
                }

                if (interaction.commandName === 'boost-clear') {
                    await updateGuildSetting(interaction.guildId, 'boostChannelId', null);
                    await interaction.reply({ content: 'Boost announcements are disabled.', flags: MessageFlags.Ephemeral });

                    return;
                }

                const channel = interaction.options.getChannel('channel', true);
                const setting = interaction.commandName === 'boost-set' ? 'boostChannelId' : 'birthdayChannelId';
                await updateGuildSetting(interaction.guildId, setting, channel.id);
                await interaction.reply({ content: `${setting === 'boostChannelId' ? 'Boost' : 'Birthday'} announcements are set to ${channel}.`, flags: MessageFlags.Ephemeral });

                return;
            }

            if (interaction.isChatInputCommand() && ['birthday-set', 'birthday-clear'].includes(interaction.commandName)) {
                const birthdays = { ...(botSettings[interaction.guildId]?.birthdays ?? {}) };
                if (interaction.commandName === 'birthday-clear') {
                    delete birthdays[interaction.user.id];
                    await updateGuildSetting(interaction.guildId, 'birthdays', birthdays);
                    await interaction.reply({ content: 'Your birthday was removed. You are opted out of birthday announcements.', flags: MessageFlags.Ephemeral });

                    return;
                }

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

                return;
            }

            if (interaction.isChatInputCommand() && ['partner-add', 'partner-remove'].includes(interaction.commandName)) {
                if (!canManageBot(interaction)) {
                    await interaction.reply({ content: 'You do not have permission to manage partnerships.', flags: MessageFlags.Ephemeral });

                    return;
                }

                const partners = [...(botSettings[interaction.guildId]?.partners ?? [])];
                const name = interaction.options.getString('name', true).trim();
                if (interaction.commandName === 'partner-remove') {
                    const remaining = partners.filter((partner) => partner.name.toLowerCase() !== name.toLowerCase());
                    if (remaining.length === partners.length) {
                        await interaction.reply({ content: 'No matching partner was found.', flags: MessageFlags.Ephemeral });

                        return;
                    }
                    await updateGuildSetting(interaction.guildId, 'partners', remaining);
                    await interaction.reply({ content: `Removed partnership with ${name}.`, flags: MessageFlags.Ephemeral });

                    return;
                }

                const url = interaction.options.getString('url', true);
                if (!url.startsWith('https://')) {
                    await interaction.reply({ content: 'Partner links must use HTTPS.', flags: MessageFlags.Ephemeral });

                    return;
                }
                const description = interaction.options.getString('description') || 'SFD-DJ.EU community partner';
                const existingIndex = partners.findIndex((partner) => partner.name.toLowerCase() === name.toLowerCase());
                const partner = { name, url, description };
                if (existingIndex >= 0) {
                    partners[existingIndex] = partner;
                } else {
                    partners.push(partner);
                }
                await updateGuildSetting(interaction.guildId, 'partners', partners.slice(0, 24));
                await interaction.reply({ content: `${name} is listed as a community partner.`, flags: MessageFlags.Ephemeral });

                return;
            }

            if (interaction.isChatInputCommand() && interaction.commandName === 'partners') {
                const partners = botSettings[interaction.guildId]?.partners ?? [];
                const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('SFD-DJ.EU community partners');
                if (partners.length === 0) {
                    embed.setDescription('No community partners have been added yet.');
                } else {
                    embed.setDescription(partners.map((partner) => `**[${partner.name}](${partner.url})**\n${partner.description}`).join('\n\n').slice(0, 4000));
                }
                await interaction.reply({ embeds: [embed] });

                return;
            }

            if (interaction.isChatInputCommand() && interaction.commandName === 'giveaway-start') {
                if (!canManageBot(interaction)) {
                    await interaction.reply({ content: 'You do not have permission to start giveaways.', flags: MessageFlags.Ephemeral });

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

                return;
            }

            if (interaction.isChatInputCommand() && interaction.commandName === 'giveaway-end') {
                if (!canManageBot(interaction)) {
                    await interaction.reply({ content: 'You do not have permission to end giveaways.', flags: MessageFlags.Ephemeral });

                    return;
                }

                const messageId = interaction.options.getString('message_id', true);
                const winners = await endGiveaway(interaction.guildId, messageId, interaction.user.tag);
                await interaction.reply({ content: winners ? `Giveaway ended. Winner${winners.length === 1 ? '' : 's'}: ${winners.length ? winners.map((winner) => `<@${winner}>`).join(', ') : 'no valid entries'}.` : 'No active giveaway was found for that message ID.', flags: MessageFlags.Ephemeral });

                return;
            }

            if (interaction.isChatInputCommand() && ['welcome-set', 'welcome-clear', 'leave-set', 'leave-clear'].includes(interaction.commandName)) {
                if (!canManageBot(interaction)) {
                    await interaction.reply({ content: 'You do not have permission to configure bot messages.', flags: MessageFlags.Ephemeral });

                    return;
                }

                const type = interaction.commandName.startsWith('welcome') ? 'welcome' : 'leave';
                if (interaction.commandName.endsWith('clear')) {
                    await updateGuildSetting(interaction.guildId, type, null);
                    await interaction.reply({ content: `${type === 'welcome' ? 'Welcome' : 'Leave'} messages are disabled.`, flags: MessageFlags.Ephemeral });

                    return;
                }

                const channel = interaction.options.getChannel('channel', true);
                const message = interaction.options.getString('message', true);
                await updateGuildSetting(interaction.guildId, type, { channelId: channel.id, message });
                await interaction.reply({ content: `${type === 'welcome' ? 'Welcome' : 'Leave'} messages are now set in ${channel}. Use {user}, {username}, {server}, or {memberCount} in the message.`, flags: MessageFlags.Ephemeral });

                return;
            }

            if (interaction.isChatInputCommand() && ['kick', 'ban', 'unban'].includes(interaction.commandName)) {
                if (!canManageBot(interaction)) {
                    await interaction.reply({ content: 'You do not have permission to moderate this server.', flags: MessageFlags.Ephemeral });

                    return;
                }

                const reason = interaction.options.getString('reason') || 'No reason provided.';
                const botMember = interaction.guild.members.me ?? await interaction.guild.members.fetchMe();
                const actorMember = interaction.guild.members.cache.get(interaction.user.id)
                    ?? await interaction.guild.members.fetch(interaction.user.id);
                const canModerateHigherRoles = actorMember.permissions.has(PermissionFlagsBits.ManageGuild);

                if (interaction.commandName === 'kick') {
                    const user = interaction.options.getUser('member', true);
                    const target = await interaction.guild.members.fetch(user.id);
                    const targetIsAboveModerator = !canModerateHigherRoles && target.roles.highest.position >= actorMember.roles.highest.position;
                    if (target.id === interaction.user.id || target.id === interaction.guild.ownerId || target.roles.highest.position >= botMember.roles.highest.position || targetIsAboveModerator) {
                        await interaction.reply({ content: 'That member cannot be kicked by this bot.', flags: MessageFlags.Ephemeral });

                        return;
                    }

                    await target.kick(reason);
                    await sendModerationLog('kick', interaction.user, `${user.tag} (${user.id})`, reason);
                    await interaction.reply({ content: `Kicked ${user.tag}.`, flags: MessageFlags.Ephemeral });

                    return;
                }

                if (interaction.commandName === 'ban') {
                    const user = interaction.options.getUser('user', true);
                    if (user.id === interaction.guild.ownerId || user.id === interaction.user.id) {
                        await interaction.reply({ content: 'That user cannot be banned by this command.', flags: MessageFlags.Ephemeral });

                        return;
                    }

                    const target = await interaction.guild.members.fetch(user.id).catch(() => null);
                    const targetIsAboveModerator = target && !canModerateHigherRoles && target.roles.highest.position >= actorMember.roles.highest.position;
                    if (target && (target.roles.highest.position >= botMember.roles.highest.position || targetIsAboveModerator)) {
                        await interaction.reply({ content: 'That member cannot be banned by this bot.', flags: MessageFlags.Ephemeral });

                        return;
                    }

                    await interaction.guild.members.ban(user.id, { reason });
                    await sendModerationLog('ban', interaction.user, `${user.tag} (${user.id})`, reason);
                    await interaction.reply({ content: `Banned ${user.tag}.`, flags: MessageFlags.Ephemeral });

                    return;
                }

                const userId = interaction.options.getString('user_id', true);
                if (!/^\d{17,20}$/.test(userId)) {
                    await interaction.reply({ content: 'Enter a valid Discord user ID.', flags: MessageFlags.Ephemeral });

                    return;
                }

                await interaction.guild.members.unban(userId, reason);
                await sendModerationLog('unban', interaction.user, userId, reason);
                await interaction.reply({ content: `Unbanned Discord user ${userId}.`, flags: MessageFlags.Ephemeral });

                return;
            }

            if (interaction.isModalSubmit() && interaction.customId === 'staff-application:submit') {
                await sendApplication(interaction, {
                    motivation: interaction.fields.getTextInputValue('motivation'),
                    experience: interaction.fields.getTextInputValue('experience'),
                    availability: interaction.fields.getTextInputValue('availability'),
                }, 'Discord');

                return;
            }

            if (interaction.isModalSubmit() && interaction.customId === 'ticket:submit') {
                await openTicket(
                    interaction,
                    interaction.fields.getTextInputValue('subject'),
                    interaction.fields.getTextInputValue('details'),
                );

                return;
            }

            if (interaction.isModalSubmit() && interaction.customId.startsWith('info:save:')) {
                const pending = pendingInfoPages.get(interaction.customId);
                pendingInfoPages.delete(interaction.customId);
                if (!pending || pending.authorId !== interaction.user.id || pending.serverId !== interaction.guildId) {
                    await interaction.reply({ content: 'This info editor has expired. Run /info again.', flags: MessageFlags.Ephemeral });

                    return;
                }

                const imageUrl = interaction.fields.getTextInputValue('image_url').trim();
                const buttonLabel = interaction.fields.getTextInputValue('button_label').trim();
                const buttonUrl = interaction.fields.getTextInputValue('button_url').trim();
                const isHttpsUrl = (value) => {
                    try {
                        return new URL(value).protocol === 'https:';
                    } catch {
                        return false;
                    }
                };

                if ((imageUrl && !isHttpsUrl(imageUrl)) || (buttonUrl && !isHttpsUrl(buttonUrl))) {
                    await interaction.reply({ content: 'Image and button links must be valid HTTPS URLs.', flags: MessageFlags.Ephemeral });

                    return;
                }
                if (Boolean(buttonLabel) !== Boolean(buttonUrl)) {
                    await interaction.reply({ content: 'Provide both a button label and button URL, or leave both empty.', flags: MessageFlags.Ephemeral });

                    return;
                }

                const pages = { ...(botSettings[pending.serverId]?.infoPages ?? {}) };
                pages[pending.key] = {
                    ...pending.page,
                    title: interaction.fields.getTextInputValue('title').trim(),
                    body: interaction.fields.getTextInputValue('body').trim(),
                    imageUrl: imageUrl || null,
                    buttonLabel: buttonLabel || null,
                    buttonUrl: buttonUrl || null,
                };
                await updateGuildSetting(pending.serverId, 'infoPages', pages);
                const shouldPublish = pending.action === 'add' || Boolean(pages[pending.key].messageId);
                if (shouldPublish) {
                    const message = await publishInfoPage(pending.serverId, pending.key, pages[pending.key]);
                    await interaction.reply({ content: `Saved and posted info page ${pending.key}: ${message.url}`, flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: `Saved info page ${pending.key}. Use /info post to publish it.`, flags: MessageFlags.Ephemeral });
                }

                return;
            }

            if (interaction.isButton() && interaction.customId === 'ticket:open') {
                await interaction.showModal(ticketModal());

                return;
            }

            if (interaction.isButton() && interaction.customId === 'staff-application:start') {
                await interaction.showModal(applicationModal());

                return;
            }

            if (interaction.isButton() && interaction.customId === 'giveaway:enter') {
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

                return;
            }

            if (interaction.isButton() && interaction.customId.startsWith('ticket:close:')) {
                await closeTicket(interaction);

                return;
            }

            if (!interaction.isButton() || !interaction.customId.startsWith('staff-application:')) {
                return;
            }

            const [, action, applicationId, applicantId] = interaction.customId.split(':');
            if (!canManageBot(interaction)) {
                await interaction.reply({ content: 'You do not have permission to review staff applications.', flags: MessageFlags.Ephemeral });

                return;
            }

            if (action === 'approve') {
                if (approvedStaffRoleId) {
                    const applicant = await interaction.guild.members.fetch(applicantId);
                    await applicant.roles.add(approvedStaffRoleId, `Staff application approved by ${interaction.user.tag}`);
                } else {
                    await interaction.reply({ content: 'Set DISCORD_APPROVED_STAFF_ROLE_ID before approving applications.', flags: MessageFlags.Ephemeral });

                    return;
                }
            }

            const embed = EmbedBuilder.from(interaction.message.embeds[0])
                .setColor(action === 'approve' ? 0x22c55e : 0xef4444)
                .addFields({ name: 'Decision', value: `${action === 'approve' ? 'Approved' : 'Rejected'} by ${interaction.user}` });
            const disabledRow = new ActionRowBuilder().addComponents(
                ...interaction.message.components.flatMap((row) => row.components).map((button) => ButtonBuilder.from(button).setDisabled(true)),
            );

            await interaction.update({ embeds: [embed], components: [disabledRow] });
            console.log(`Application ${applicationId} ${action}d by ${interaction.user.tag}`);
        } catch (error) {
            console.error('Discord interaction failed:', error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Something went wrong. Please try again or contact an administrator.', flags: MessageFlags.Ephemeral }).catch(() => {});
            }
        }
    });

    client.login(token).catch((error) => {
        console.error('Discord bot could not log in:', error.message);
        process.exitCode = 1;
    });
}
