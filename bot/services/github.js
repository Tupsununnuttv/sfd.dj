import { EmbedBuilder } from 'discord.js';
import { client } from '../lib/client.js';
import { botSettings, updateGuildSetting } from '../lib/settings.js';

export const fetchLatestRelease = async (repository) => {
    const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'SFD-DJ.EU-Discord-Bot' },
        signal: AbortSignal.timeout(8000),
    });
    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        throw new Error(`GitHub returned HTTP ${response.status} for ${repository}`);
    }

    return response.json();
};

/** New releases of the repositories a server tracks (/github-track), posted to the channel it chose. Releases that already exist are not posted. */
export const pollGithubReleases = async (serverId) => {
    for (const repository of botSettings[serverId]?.githubRepositories ?? []) {
        try {
            const release = await fetchLatestRelease(repository.name);
            if (!release) {
                continue;
            }
            if (repository.lastReleaseId === undefined) {
                repository.lastReleaseId = release.id;
                await updateGuildSetting(serverId, 'githubRepositories', botSettings[serverId].githubRepositories);

                continue;
            }
            if (repository.lastReleaseId === release.id) {
                continue;
            }

            const channel = await client.channels.fetch(repository.channelId);
            if (channel?.isTextBased() && channel.isSendable()) {
                await channel.send({
                    embeds: [new EmbedBuilder()
                        .setColor(0x24292f)
                        .setTitle(`New release: ${release.name || release.tag_name}`)
                        .setURL(release.html_url)
                        .setDescription(String(release.body || 'A new release is available.').slice(0, 3900))
                        .addFields({ name: 'Repository', value: repository.name })
                        .setTimestamp(new Date(release.published_at || release.created_at))],
                    allowedMentions: { parse: [] },
                });
            }

            repository.lastReleaseId = release.id;
            await updateGuildSetting(serverId, 'githubRepositories', botSettings[serverId].githubRepositories);
        } catch (error) {
            console.error(`Could not check GitHub releases for ${repository.name}:`, error.message);
        }
    }
};
