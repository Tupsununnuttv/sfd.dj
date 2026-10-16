import { client } from '../lib/client.js';
import { botSettings, updateGuildSetting } from '../lib/settings.js';

/** Today's birthdays (only of people who opted in with /birthday-set), announced once a day in the channel a server chose. */
export const checkBirthdays = async () => {
    const today = new Date().toISOString().slice(5, 10);
    for (const [serverId, settings] of Object.entries(botSettings)) {
        if (!settings.birthdayChannelId || settings.birthdaySentDate === today) {
            continue;
        }

        const birthdays = Object.entries(settings.birthdays ?? {}).filter(([, date]) => date === today).map(([userId]) => userId);
        if (birthdays.length > 0) {
            const channel = await client.channels.fetch(settings.birthdayChannelId).catch(() => null);
            if (!channel?.isTextBased() || !channel.isSendable()) {
                continue;
            }

            const mentions = birthdays.map((userId) => `<@${userId}>`);
            await channel.send({
                content: `Happy birthday, ${mentions.join(', ')}! 🎂`,
                allowedMentions: { users: birthdays },
            });
        }

        await updateGuildSetting(serverId, 'birthdaySentDate', today);
    }
};
