import { randomInt } from 'node:crypto';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from 'discord.js';
import { client } from '../lib/client.js';
import { botSettings, updateGuildSetting } from '../lib/settings.js';

/** Draw the winners of a giveaway (`messageId` is its message), mark it ended and close its button. Returns the winners, or null if there is no active giveaway for that message. */
export const endGiveaway = async (serverId, messageId, endedBy = 'Scheduled draw') => {
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

/** Every giveaway whose time is up. */
export const settleDueGiveaways = async () => {
    for (const [serverId, settings] of Object.entries(botSettings)) {
        const due = (settings.giveaways ?? []).filter((giveaway) => giveaway.active && Date.parse(giveaway.endsAt) <= Date.now());
        for (const giveaway of due) {
            await endGiveaway(serverId, giveaway.messageId);
        }
    }
};
