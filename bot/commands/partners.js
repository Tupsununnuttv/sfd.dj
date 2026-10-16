import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { requireManager } from '../lib/permissions.js';
import { botSettings, updateGuildSetting } from '../lib/settings.js';

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('partner-add')
            .setDescription('Add a community partnership')
            .addStringOption((option) => option.setName('name').setDescription('Partner name').setMaxLength(70).setRequired(true))
            .addStringOption((option) => option.setName('url').setDescription('Partner HTTPS website').setMaxLength(300).setRequired(true))
            .addStringOption((option) => option.setName('description').setDescription('Short description').setMaxLength(250)),
        async execute(interaction) {
            if (!await requireManager(interaction, 'manage partnerships')) {
                return;
            }

            const partners = [...(botSettings[interaction.guildId]?.partners ?? [])];
            const name = interaction.options.getString('name', true).trim();
            const url = interaction.options.getString('url', true);
            if (!url.startsWith('https://')) {
                await interaction.reply({ content: 'Partner links must use HTTPS.', flags: MessageFlags.Ephemeral });

                return;
            }
            const description = interaction.options.getString('description') || 'SFD-DJ.EU community partner';
            const existingIndex = partners.findIndex((partner) => partner.name.toLowerCase() === name.toLowerCase());
            const partner = { name, url, description };
            if (existingIndex >= 0) {
                partners[existingIndex] = partner;
            } else {
                partners.push(partner);
            }
            await updateGuildSetting(interaction.guildId, 'partners', partners.slice(0, 24));
            await interaction.reply({ content: `${name} is listed as a community partner.`, flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('partner-remove')
            .setDescription('Remove a community partnership')
            .addStringOption((option) => option.setName('name').setDescription('Partner name').setMaxLength(70).setRequired(true)),
        async execute(interaction) {
            if (!await requireManager(interaction, 'manage partnerships')) {
                return;
            }

            const partners = [...(botSettings[interaction.guildId]?.partners ?? [])];
            const name = interaction.options.getString('name', true).trim();
            const remaining = partners.filter((partner) => partner.name.toLowerCase() !== name.toLowerCase());
            if (remaining.length === partners.length) {
                await interaction.reply({ content: 'No matching partner was found.', flags: MessageFlags.Ephemeral });

                return;
            }
            await updateGuildSetting(interaction.guildId, 'partners', remaining);
            await interaction.reply({ content: `Removed partnership with ${name}.`, flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('partners')
            .setDescription('Show community partners'),
        async execute(interaction) {
            const partners = botSettings[interaction.guildId]?.partners ?? [];
            const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('SFD-DJ.EU community partners');
            if (partners.length === 0) {
                embed.setDescription('No community partners have been added yet.');
            } else {
                embed.setDescription(partners.map((partner) => `**[${partner.name}](${partner.url})**\n${partner.description}`).join('\n\n').slice(0, 4000));
            }
            await interaction.reply({ embeds: [embed] });
        },
    },
];
