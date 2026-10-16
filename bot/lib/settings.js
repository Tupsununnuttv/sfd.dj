import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import process from 'node:process';
import { legacySettingsPath, settingsPath } from '../config/index.js';

/** What each server has set up, by server id: tickets, welcome and leave messages, giveaways, birthdays, partners, info posts ... (`let`: loadBotSettings replaces it, importers always see the current one). */
export let botSettings = {};
let settingsWrite = Promise.resolve();

export const loadBotSettings = async () => {
    // the file used to live in the website's storage: take it along, once (the old one stays where it is)
    if (legacySettingsPath && !existsSync(settingsPath) && existsSync(legacySettingsPath)) {
        await mkdir(dirname(settingsPath), { recursive: true });
        await copyFile(legacySettingsPath, settingsPath);
    }

    try {
        botSettings = JSON.parse(await readFile(settingsPath, 'utf8'));
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }

        botSettings = {};
    }
};

/** Save one setting of one server. Writes wait for each other, and the file is replaced whole, so it is never half written. */
export const updateGuildSetting = async (guildId, setting, value) => {
    settingsWrite = settingsWrite.then(async () => {
        botSettings[guildId] ??= {};
        botSettings[guildId][setting] = value;
        await mkdir(dirname(settingsPath), { recursive: true });
        const temporaryPath = `${settingsPath}.${process.pid}.tmp`;
        await writeFile(temporaryPath, JSON.stringify(botSettings, null, 2), 'utf8');
        await rename(temporaryPath, settingsPath);
    });

    await settingsWrite;
};
