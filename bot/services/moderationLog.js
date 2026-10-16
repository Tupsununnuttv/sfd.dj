import { EmbedBuilder } from 'discord.js';
import { modLogChannelId } from '../config/index.js';
import { client } from '../lib/client.js';

/** One line in the moderation log channel (if there is one): who kicked, banned or unbanned whom, and why. */
export const sendModerationLog = async (action, actor, target, reason) => {
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
