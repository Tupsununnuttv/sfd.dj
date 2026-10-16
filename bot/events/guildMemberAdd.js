import { Events } from 'discord.js';
import { memberRoleId } from '../config/index.js';
import { sendMemberNotice } from '../services/memberNotices.js';

/** Somebody joined: the automatic member role, and the welcome message if the server has one. */
export const event = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        if (memberRoleId) {
            try {
                await member.roles.add(memberRoleId, 'Automatic new member role');
                console.log(`Assigned member role to ${member.user.tag}`);
            } catch (error) {
                console.error(`Could not assign the member role to ${member.user.tag}:`, error.message);
            }
        } else {
            console.warn('DISCORD_MEMBER_ROLE_ID is not set; skipped the automatic member role.');
        }

        try {
            await sendMemberNotice(member, 'welcome');
        } catch (error) {
            console.error(`Could not send a welcome message for ${member.user.tag}:`, error.message);
        }
    },
};
