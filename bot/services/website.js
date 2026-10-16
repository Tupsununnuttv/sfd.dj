import { EmbedBuilder } from 'discord.js';
import { siteUrl, statusUrl, token } from '../config/index.js';
import { client } from '../lib/client.js';
import { botSettings, updateGuildSetting } from '../lib/settings.js';

/** Does the website answer? (/status) */
export const checkWebsiteStatus = async () => {
    const url = statusUrl;
    const started = Date.now();
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'follow' });

        return { url, ok: response.ok, status: response.status, elapsed: Date.now() - started };
    } catch (error) {
        return { url, ok: false, status: error.name === 'TimeoutError' ? 'timeout' : 'unreachable', elapsed: Date.now() - started };
    }
};

/** What the website says to everybody (its announcements), passed on to the channel a server chose with /updates-set. */
export const pollWebsiteAnnouncements = async (serverId) => {
    const settings = botSettings[serverId];
    if (!settings?.updatesChannelId) {
        return;
    }

    const cursor = settings.announcementsAfter;
    const endpoint = new URL('/api/discord/announcements', siteUrl);
    if (cursor !== undefined) {
        endpoint.searchParams.set('after', String(cursor));
    }

    const response = await fetch(endpoint, {
        headers: { Authorization: `Bot ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
        throw new Error(`Announcement feed returned HTTP ${response.status}`);
    }

    const feed = await response.json();
    if (cursor === undefined) {
        await updateGuildSetting(serverId, 'announcementsAfter', feed.latest_id);

        return;
    }

    const channel = await client.channels.fetch(settings.updatesChannelId);
    if (!channel?.isTextBased() || !channel.isSendable()) {
        return;
    }

    for (const announcement of feed.announcements) {
        const warning = announcement.level === 'warning';
        await channel.send({
            embeds: [new EmbedBuilder()
                .setColor(warning ? 0xf59e0b : 0x5865f2)
                .setTitle(warning ? 'SFD-DJ.EU notice' : 'SFD-DJ.EU update')
                .setURL(siteUrl)
                .setDescription(String(announcement.message).slice(0, 3900))
                .setTimestamp(new Date(announcement.created_at))],
            allowedMentions: { parse: [] },
        });
        await updateGuildSetting(serverId, 'announcementsAfter', announcement.id);
    }
};
