import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { staffRoleId } from '../config/index.js';

export const roleIdsFor = (interaction) => Array.isArray(interaction.member?.roles)
    ? interaction.member.roles
    : [...(interaction.member?.roles?.cache?.keys() ?? [])];

/** Somebody who may set the bot up: a server manager, or the staff role. */
export const canManageBot = (interaction) => interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    || (staffRoleId && roleIdsFor(interaction).includes(staffRoleId));

/** Lets a manager through; anybody else is told so ("You do not have permission to <what>.") and gets false. */
export const requireManager = async (interaction, what) => {
    if (canManageBot(interaction)) {
        return true;
    }

    await interaction.reply({ content: `You do not have permission to ${what}.`, flags: MessageFlags.Ephemeral });

    return false;
};
