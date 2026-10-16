import { Events } from 'discord.js';
import { announceBoost } from '../services/memberNotices.js';

/** A member started boosting the server: thank them where the server asked for it. */
export const event = {
    name: Events.GuildMemberUpdate,
    async execute(before, after) {
        if (!before.premiumSinceTimestamp && after.premiumSinceTimestamp) {
            try {
                await announceBoost(after);
            } catch (error) {
                console.error(`Could not announce ${after.user.tag}'s boost:`, error.message);
            }
        }
    },
};
