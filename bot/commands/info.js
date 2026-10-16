import { ChannelType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { requireManager } from '../lib/permissions.js';
import { botSettings, updateGuildSetting } from '../lib/settings.js';
import { infoModal, pendingInfoPages, publishInfoPage } from '../services/infoPages.js';
import { client } from '../lib/client.js';

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('info')
            .setDescription('Create and manage server information posts')
            .addSubcommand((subcommand) => subcommand.setName('add').setDescription('Create an info post')
                .addStringOption((option) => option.setName('id').setDescription('Short key, for example welcome or rules').setMaxLength(32).setRequired(true))
                .addStringOption((option) => option.setName('title').setDescription('Heading for the info post').setMaxLength(100).setRequired(true))
                .addChannelOption((option) => option.setName('channel').setDescription('Where the post will appear').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)))
            .addSubcommand((subcommand) => subcommand.setName('edit').setDescription('Edit an existing info post')
                .addStringOption((option) => option.setName('id').setDescription('Info post key').setMaxLength(32).setRequired(true)))
            .addSubcommand((subcommand) => subcommand.setName('delete').setDescription('Delete an info post and its published message')
                .addStringOption((option) => option.setName('id').setDescription('Info post key').setMaxLength(32).setRequired(true)))
            .addSubcommand((subcommand) => subcommand.setName('post').setDescription('Publish or update an info post')
                .addStringOption((option) => option.setName('id').setDescription('Info post key').setMaxLength(32).setRequired(true))
                .addChannelOption((option) => option.setName('channel').setDescription('Override the saved channel').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)))
            .addSubcommand((subcommand) => subcommand.setName('list').setDescription('List configured info posts')),
        async execute(interaction) {
            if (!await requireManager(interaction, 'manage info posts')) {
                return;
            }

            const action = interaction.options.getSubcommand();
            const key = interaction.options.getString('id');
            const pages = { ...(botSettings[interaction.guildId]?.infoPages ?? {}) };

            if (action === 'list') {
                const entries = Object.entries(pages);
                await interaction.reply({
                    content: entries.length
                        ? entries.map(([pageKey, page]) => `**${pageKey}**: ${page.title} · <#${page.channelId}> · ${page.messageId ? 'posted' : 'not posted'}`).join('\n').slice(0, 1900)
                        : 'No info posts are configured. Use `/info add` to create one.',
                    flags: MessageFlags.Ephemeral,
                });

                return;
            }

            if (!/^[a-z0-9_-]{1,32}$/.test(key)) {
                await interaction.reply({ content: 'Use a short lowercase ID containing letters, numbers, hyphens, or underscores.', flags: MessageFlags.Ephemeral });

                return;
            }

            if (action === 'delete') {
                const page = pages[key];
                if (!page) {
                    await interaction.reply({ content: `No info post exists with ID ${key}.`, flags: MessageFlags.Ephemeral });

                    return;
                }
                if (page.messageId) {
                    const channel = await client.channels.fetch(page.channelId).catch(() => null);
                    const message = await channel?.messages.fetch(page.messageId).catch(() => null);
                    await message?.delete().catch(() => {});
                }
                delete pages[key];
                await updateGuildSetting(interaction.guildId, 'infoPages', pages);
                await interaction.reply({ content: `Deleted info post ${key}.`, flags: MessageFlags.Ephemeral });

                return;
            }

            if (action === 'post') {
                const page = pages[key];
                if (!page) {
                    await interaction.reply({ content: `No info post exists with ID ${key}.`, flags: MessageFlags.Ephemeral });

                    return;
                }
                const targetChannel = interaction.options.getChannel('channel')?.id || page.channelId;
                const message = await publishInfoPage(interaction.guildId, key, page, targetChannel);
                await interaction.reply({ content: `Info post ${message.url} is published.`, flags: MessageFlags.Ephemeral });

                return;
            }

            if (action === 'add' && pages[key]) {
                await interaction.reply({ content: `Info post ${key} already exists; use /info edit instead.`, flags: MessageFlags.Ephemeral });

                return;
            }
            if (action === 'edit' && !pages[key]) {
                await interaction.reply({ content: `No info post exists with ID ${key}.`, flags: MessageFlags.Ephemeral });

                return;
            }

            const page = action === 'add'
                ? { key, title: interaction.options.getString('title', true), channelId: interaction.options.getChannel('channel', true).id }
                : pages[key];
            const modal = infoModal(action, key, page.title, page, interaction.user.id);
            pendingInfoPages.set(modal.data.custom_id, { serverId: interaction.guildId, key, page, action, authorId: interaction.user.id });
            await interaction.showModal(modal);
        },
    },
];
