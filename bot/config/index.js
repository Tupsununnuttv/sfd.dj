// Everything the bot reads from the environment, in one place. See ../.env.example for what each setting is.
import './env.js';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const env = process.env;

/** The live site. What the bot shows and links to when it is not told another public address. */
export const PUBLIC_SITE = 'https://sfd-dj.eu';

const isLocalHost = (host) => host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.test')
    || host === '[::1]' || /^(0|10|127)\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);

/**
 * A public web address, or null: not localhost or a private network (on a PC the website's own address is http://localhost:8000, and the bot must never show that),
 * and not "${APP_URL}" written as it is (Node does not fill that in when it reads a .env file).
 */
export const publicAddress = (value) => {
    try {
        const url = new URL(value);

        return /^https?:$/.test(url.protocol) && !isLocalHost(url.hostname) ? value.replace(/\/+$/, '') : null;
    } catch {
        return null;
    }
};

/** The site this bot belongs to. Not APP_URL, and never a local address: Discord members cannot open those. */
export const siteUrl = publicAddress(env.DISCORD_WEBSITE_URL) ?? PUBLIC_SITE;
/** What /status checks. */
export const statusUrl = publicAddress(env.DISCORD_STATUS_URL) ?? siteUrl;
/** The line under the bot's name: "Listening to https://sfd-dj.eu/" */
export const presenceText = `${siteUrl}/`;

// The bot's application is the one its token belongs to: it is read after login (readyClient.application.id), not from DISCORD_CLIENT_ID,
// which is the app the website's Discord login uses and may be another one.
export const token = env.DISCORD_BOT_TOKEN;
export const guildId = env.DISCORD_GUILD_ID;
export const memberRoleId = env.DISCORD_MEMBER_ROLE_ID;
export const applicationsChannelId = env.DISCORD_STAFF_APPLICATIONS_CHANNEL_ID;
export const staffRoleId = env.DISCORD_STAFF_ROLE_ID;
export const approvedStaffRoleId = env.DISCORD_APPROVED_STAFF_ROLE_ID;
export const modLogChannelId = env.DISCORD_MOD_LOG_CHANNEL_ID;

// What an applicant reads first: #staff-requirements and #staff-application-questions (a channel mention shows as the channel's name and opens it).
// The website's staff application page links to the same two (staff_application_links in config/services.php).
export const staffApplicationRequirements = ['827776116851736628', '827776072551759912'].map((channelId) => `<#${channelId}>`);
export const staffApplicationQuestions = {
    motivation: env.DISCORD_STAFF_QUESTION_MOTIVATION || 'Why do you want to join the staff team?',
    experience: env.DISCORD_STAFF_QUESTION_EXPERIENCE || 'What relevant experience do you have?',
    availability: env.DISCORD_STAFF_QUESTION_AVAILABILITY || 'When are you usually available?',
};

/** Where the bot keeps what the servers set up (tickets, welcome messages, giveaways, birthdays ...). Not in git. */
export const settingsPath = env.DISCORD_BOT_SETTINGS_PATH || fileURLToPath(new URL('../data/settings.json', import.meta.url));
/** Before the bot had a folder of its own that file lived in the website's storage: it is copied over once (see lib/settings.js). */
export const legacySettingsPath = env.DISCORD_BOT_SETTINGS_PATH ? null : fileURLToPath(new URL('../../storage/app/discord-bot-settings.json', import.meta.url));
