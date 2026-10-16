import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { approvedStaffRoleId } from '../config/index.js';
import { canManageBot } from '../lib/permissions.js';
import { applicationModal, sendApplication } from '../services/applications.js';

/** Approve or Reject under an application in the staff channel (`staff-application:<approve|reject>:<application>:<applicant's Discord id, or "none">`). */
const review = async (interaction) => {
    const [, action, applicationId, applicantId] = interaction.customId.split(':');
    if (!canManageBot(interaction)) {
        await interaction.reply({ content: 'You do not have permission to review staff applications.', flags: MessageFlags.Ephemeral });

        return;
    }

    // an application sent on the website by somebody without a linked Discord account has "none" instead of a Discord ID: there is no Discord role to give
    const onDiscord = /^\d+$/.test(applicantId);
    if (action === 'approve' && onDiscord) {
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
        .addFields({ name: 'Decision', value: `${action === 'approve' ? 'Approved' : 'Rejected'} by ${interaction.user}${action === 'approve' && !onDiscord ? '. No Discord account is linked, so no Discord role was given: give them a role in the Admin panel.' : ''}` });
    const disabledRow = new ActionRowBuilder().addComponents(
        ...interaction.message.components.flatMap((row) => row.components).map((button) => ButtonBuilder.from(button).setDisabled(true)),
    );

    await interaction.update({ embeds: [embed], components: [disabledRow] });
    console.log(`Application ${applicationId} ${action}d by ${interaction.user.tag}`);
};

export const buttons = [
    { id: 'staff-application:start', execute: (interaction) => interaction.showModal(applicationModal()) },
    { prefix: 'staff-application:', execute: review }, // after the one above: this takes every other staff-application button
];

export const modals = [
    {
        id: 'staff-application:submit',
        execute: (interaction) => sendApplication(interaction, {
            motivation: interaction.fields.getTextInputValue('motivation'),
            experience: interaction.fields.getTextInputValue('experience'),
            availability: interaction.fields.getTextInputValue('availability'),
        }, 'Discord'),
    },
];
