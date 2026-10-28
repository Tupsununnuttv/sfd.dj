import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { siteUrl, staffApplicationRequirements } from '../config/index.js';
import { applicationStartButton, loadForm } from '../services/applications.js';

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('apply')
            .setDescription('Apply to join the SFD-DJ.EU staff team'),
        async execute(interaction) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            // the questions come from the website, so they are the same here and there; with no answer from it nobody can apply
            if (!await loadForm()) {
                await interaction.editReply(`Staff applications are not available right now. Please try again later, or apply on the website: ${siteUrl}/staff/apply`);

                return;
            }

            const requirements = staffApplicationRequirements.length
                ? `Read these first:\n${staffApplicationRequirements.map((requirement) => `• ${requirement}`).join('\n')}\n\n`
                : '';
            await interaction.editReply({
                content: `**SFD-DJ.EU staff application**\n${requirements}It has 15 questions in 4 short parts, and you can only have one application waiting at a time. You can also apply on the website, where you can follow its status: ${siteUrl}/staff/apply`,
                components: [applicationStartButton],
            });
        },
    },
];
