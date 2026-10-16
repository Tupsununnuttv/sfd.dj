import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { client } from '../lib/client.js';
import { botSettings, updateGuildSetting } from '../lib/settings.js';

/** Info posts being created or edited: the form's id says which, until its owner sends it (see components/info.js). */
export const pendingInfoPages = new Map();

const infoInput = (id, label, maxLength, required, value = '') => {
    const input = new TextInputBuilder()
        .setCustomId(id)
        .setLabel(label.slice(0, 45))
        .setStyle(id === 'body' ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setMaxLength(maxLength)
        .setRequired(required);
    if (value) {
        input.setValue(value.slice(0, maxLength));
    }

    return input;
};

export const infoModal = (action, key, title, page, userId) => new ModalBuilder()
    .setCustomId(`info:save:${action}:${key}:${userId}`)
    .setTitle(`${action === 'add' ? 'Create' : 'Edit'} info: ${title}`.slice(0, 45))
    .addComponents(
        new ActionRowBuilder().addComponents(infoInput('title', 'Post title', 256, true, page.title || title)),
        new ActionRowBuilder().addComponents(infoInput('body', 'Post text', 4000, true, page.body || '')),
        new ActionRowBuilder().addComponents(infoInput('image_url', 'Optional banner image HTTPS URL', 500, false, page.imageUrl || '')),
        new ActionRowBuilder().addComponents(infoInput('button_label', 'Optional link button label', 80, false, page.buttonLabel || '')),
        new ActionRowBuilder().addComponents(infoInput('button_url', 'Optional link button HTTPS URL', 500, false, page.buttonUrl || '')),
    );

const infoPagePayload = (page) => {
    const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(page.title)
        .setDescription(page.body);
    if (page.imageUrl) {
        embed.setImage(page.imageUrl);
    }
    const components = page.buttonLabel && page.buttonUrl
        ? [new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(page.buttonLabel).setURL(page.buttonUrl))]
        : [];

    return { embeds: [embed], components };
};

/** Post an info page in its channel, or update the message it already has. */
export const publishInfoPage = async (serverId, key, page, channelId = page.channelId) => {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased() || !channel.isSendable()) {
        throw new Error('The configured info channel cannot receive messages.');
    }

    let message = null;
    if (page.messageId && channelId === page.channelId) {
        message = await channel.messages.fetch(page.messageId).catch(() => null);
    }
    if (message) {
        await message.edit(infoPagePayload(page));
    } else {
        message = await channel.send(infoPagePayload(page));
    }

    const pages = { ...(botSettings[serverId]?.infoPages ?? {}), [key]: { ...page, channelId, messageId: message.id } };
    await updateGuildSetting(serverId, 'infoPages', pages);

    return message;
};
