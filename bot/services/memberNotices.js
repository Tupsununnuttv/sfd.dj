import { EmbedBuilder } from 'discord.js';
import { client } from '../lib/client.js';
import { botSettings } from '../lib/settings.js';

export const renderMemberMessage = (template, member) => template
    .replaceAll('{user}', `<@${member.id}>`)
    .replaceAll('{username}', member.user.username)
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{memberCount}', String(member.guild.memberCount));

/** The welcome or leave message of a server (`type` is 'welcome' or 'leave'), if it has set one up. */
export const sendMemberNotice = async (member, type) => {
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

export const announceBoost = async (member) => {
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
