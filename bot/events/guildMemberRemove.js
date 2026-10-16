import { Events } from 'discord.js';
import { sendMemberNotice } from '../services/memberNotices.js';

/** Somebody left: the leave message, if the server has one. */
export const event = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        try {
            await sendMemberNotice(member, 'leave');
        } catch (error) {
            console.error(`Could not send a leave message for ${member.user.tag}:`, error.message);
        }
    },
};
