import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { staffApplicationRequirements } from '../config/index.js';
import { applicationStartButton } from '../services/applications.js';

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('apply')
            .setDescription('Apply to join the SFD-DJ.EU staff team'),
        async execute(interaction) {
            const requirements = staffApplicationRequirements.length
                ? `Requirements:\n${staffApplicationRequirements.map((requirement) => `• ${requirement}`).join('\n')}`
                : 'There are no additional requirements right now.';
            await interaction.reply({ content: `SFD-DJ.EU staff application\n${requirements}`, components: [applicationStartButton], flags: MessageFlags.Ephemeral });
        },
    },
];
