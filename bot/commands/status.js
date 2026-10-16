import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { checkWebsiteStatus } from '../services/website.js';

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('status')
            .setDescription('Check whether the SFD-DJ.EU website is responding'),
        async execute(interaction) {
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
        },
    },
];
