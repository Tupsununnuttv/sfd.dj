import { MessageFlags } from 'discord.js';
import { botSettings, updateGuildSetting } from '../lib/settings.js';
import { pendingInfoPages, publishInfoPage } from '../services/infoPages.js';

const isHttpsUrl = (value) => {
    try {
        return new URL(value).protocol === 'https:';
    } catch {
        return false;
    }
};

export const modals = [
    {
        // the form of /info add and /info edit: `info:save:<add|edit>:<key>:<who opened it>`
        prefix: 'info:save:',
        async execute(interaction) {
            const pending = pendingInfoPages.get(interaction.customId);
            pendingInfoPages.delete(interaction.customId);
            if (!pending || pending.authorId !== interaction.user.id || pending.serverId !== interaction.guildId) {
                await interaction.reply({ content: 'This info editor has expired. Run /info again.', flags: MessageFlags.Ephemeral });

                return;
            }

            const imageUrl = interaction.fields.getTextInputValue('image_url').trim();
            const buttonLabel = interaction.fields.getTextInputValue('button_label').trim();
            const buttonUrl = interaction.fields.getTextInputValue('button_url').trim();

            if ((imageUrl && !isHttpsUrl(imageUrl)) || (buttonUrl && !isHttpsUrl(buttonUrl))) {
                await interaction.reply({ content: 'Image and button links must be valid HTTPS URLs.', flags: MessageFlags.Ephemeral });

                return;
            }
            if (Boolean(buttonLabel) !== Boolean(buttonUrl)) {
                await interaction.reply({ content: 'Provide both a button label and button URL, or leave both empty.', flags: MessageFlags.Ephemeral });

                return;
            }

            const pages = { ...(botSettings[pending.serverId]?.infoPages ?? {}) };
            pages[pending.key] = {
                ...pending.page,
                title: interaction.fields.getTextInputValue('title').trim(),
                body: interaction.fields.getTextInputValue('body').trim(),
                imageUrl: imageUrl || null,
                buttonLabel: buttonLabel || null,
                buttonUrl: buttonUrl || null,
            };
            await updateGuildSetting(pending.serverId, 'infoPages', pages);
            const shouldPublish = pending.action === 'add' || Boolean(pages[pending.key].messageId);
            if (shouldPublish) {
                const message = await publishInfoPage(pending.serverId, pending.key, pages[pending.key]);
                await interaction.reply({ content: `Saved and posted info page ${pending.key}: ${message.url}`, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: `Saved info page ${pending.key}. Use /info post to publish it.`, flags: MessageFlags.Ephemeral });
            }
        },
    },
];
