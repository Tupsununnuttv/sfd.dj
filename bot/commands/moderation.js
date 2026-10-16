import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { requireManager } from '../lib/permissions.js';
import { sendModerationLog } from '../services/moderationLog.js';

/** Who is doing it and who the bot is, and whether the person may touch members above them. */
const people = async (interaction) => {
    const botMember = interaction.guild.members.me ?? await interaction.guild.members.fetchMe();
    const actorMember = interaction.guild.members.cache.get(interaction.user.id)
        ?? await interaction.guild.members.fetch(interaction.user.id);

    return { botMember, actorMember, canModerateHigherRoles: actorMember.permissions.has(PermissionFlagsBits.ManageGuild) };
};

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kick a member from this server')
            .addUserOption((option) => option.setName('member').setDescription('Member to kick').setRequired(true))
            .addStringOption((option) => option.setName('reason').setDescription('Reason shown in the audit log').setMaxLength(400)),
        async execute(interaction) {
            if (!await requireManager(interaction, 'moderate this server')) {
                return;
            }

            const reason = interaction.options.getString('reason') || 'No reason provided.';
            const { botMember, actorMember, canModerateHigherRoles } = await people(interaction);
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
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Ban a user from this server')
            .addUserOption((option) => option.setName('user').setDescription('User to ban').setRequired(true))
            .addStringOption((option) => option.setName('reason').setDescription('Reason shown in the audit log').setMaxLength(400)),
        async execute(interaction) {
            if (!await requireManager(interaction, 'moderate this server')) {
                return;
            }

            const reason = interaction.options.getString('reason') || 'No reason provided.';
            const { botMember, actorMember, canModerateHigherRoles } = await people(interaction);
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
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('unban')
            .setDescription('Unban a user by Discord ID')
            .addStringOption((option) => option.setName('user_id').setDescription('Discord user ID').setMinLength(17).setMaxLength(20).setRequired(true))
            .addStringOption((option) => option.setName('reason').setDescription('Reason shown in the audit log').setMaxLength(400)),
        async execute(interaction) {
            if (!await requireManager(interaction, 'moderate this server')) {
                return;
            }

            const reason = interaction.options.getString('reason') || 'No reason provided.';
            const userId = interaction.options.getString('user_id', true);
            if (!/^\d{17,20}$/.test(userId)) {
                await interaction.reply({ content: 'Enter a valid Discord user ID.', flags: MessageFlags.Ephemeral });

                return;
            }

            await interaction.guild.members.unban(userId, reason);
            await sendModerationLog('unban', interaction.user, userId, reason);
            await interaction.reply({ content: `Unbanned Discord user ${userId}.`, flags: MessageFlags.Ephemeral });
        },
    },
];
