import { ChannelType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { requireManager } from '../lib/permissions.js';
import { botSettings, updateGuildSetting } from '../lib/settings.js';
import { fetchLatestRelease } from '../services/github.js';
import { pollWebsiteAnnouncements } from '../services/website.js';

const permission = 'configure update feeds';
const repositoryName = /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/;

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('updates-set')
            .setDescription('Set where website announcements are posted')
            .addChannelOption((option) => option.setName('channel').setDescription('Channel for SFD-DJ.EU updates').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)),
        async execute(interaction) {
            if (!await requireManager(interaction, permission)) {
                return;
            }

            const channel = interaction.options.getChannel('channel', true);
            await updateGuildSetting(interaction.guildId, 'updatesChannelId', channel.id);
            await pollWebsiteAnnouncements(interaction.guildId);
            await interaction.reply({ content: `New SFD-DJ.EU announcements will be posted in ${channel}.`, flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('updates-clear')
            .setDescription('Stop posting website announcements in this server'),
        async execute(interaction) {
            if (!await requireManager(interaction, permission)) {
                return;
            }

            await updateGuildSetting(interaction.guildId, 'updatesChannelId', null);
            await interaction.reply({ content: 'Website announcements are no longer posted in Discord.', flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('github-track')
            .setDescription('Track releases from a public GitHub repository')
            .addStringOption((option) => option.setName('repository').setDescription('Repository in owner/name format').setMaxLength(100).setRequired(true))
            .addChannelOption((option) => option.setName('channel').setDescription('Where releases are posted').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)),
        async execute(interaction) {
            if (!await requireManager(interaction, permission)) {
                return;
            }

            const repository = interaction.options.getString('repository', true).trim();
            if (!repositoryName.test(repository)) {
                await interaction.reply({ content: 'Use the public GitHub repository format owner/name.', flags: MessageFlags.Ephemeral });

                return;
            }

            const repositories = [...(botSettings[interaction.guildId]?.githubRepositories ?? [])];
            const existingIndex = repositories.findIndex((entry) => entry.name.toLowerCase() === repository.toLowerCase());
            const channel = interaction.options.getChannel('channel', true);
            const latest = await fetchLatestRelease(repository);
            const subscription = { name: repository, channelId: channel.id, lastReleaseId: latest?.id ?? null };
            if (existingIndex >= 0) {
                repositories[existingIndex] = subscription;
            } else {
                repositories.push(subscription);
            }
            await updateGuildSetting(interaction.guildId, 'githubRepositories', repositories.slice(-20));
            await interaction.reply({ content: latest
                ? `Tracking new releases from ${repository} in ${channel}. Existing releases will not be reposted.`
                : `Tracking ${repository} in ${channel}. Updates will appear when its first release is published.`, flags: MessageFlags.Ephemeral });
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('github-untrack')
            .setDescription('Stop tracking GitHub releases')
            .addStringOption((option) => option.setName('repository').setDescription('Repository in owner/name format').setMaxLength(100).setRequired(true)),
        async execute(interaction) {
            if (!await requireManager(interaction, permission)) {
                return;
            }

            const repository = interaction.options.getString('repository', true).trim();
            if (!repositoryName.test(repository)) {
                await interaction.reply({ content: 'Use the public GitHub repository format owner/name.', flags: MessageFlags.Ephemeral });

                return;
            }

            const repositories = [...(botSettings[interaction.guildId]?.githubRepositories ?? [])];
            const existingIndex = repositories.findIndex((entry) => entry.name.toLowerCase() === repository.toLowerCase());
            if (existingIndex < 0) {
                await interaction.reply({ content: 'That repository is not being tracked.', flags: MessageFlags.Ephemeral });

                return;
            }
            repositories.splice(existingIndex, 1);
            await updateGuildSetting(interaction.guildId, 'githubRepositories', repositories);
            await interaction.reply({ content: `Stopped tracking ${repository}.`, flags: MessageFlags.Ephemeral });
        },
    },
];
