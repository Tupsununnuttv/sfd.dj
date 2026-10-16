import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { siteUrl, token } from '../config/index.js';

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('profile')
            .setDescription('Show your linked SFD-DJ.EU level and achievements'),
        async execute(interaction) {
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
        },
    },
];
