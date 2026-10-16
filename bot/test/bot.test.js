// `npm test` in this folder. Nothing here logs in to Discord or reaches the network.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

// before anything reads the environment: settings in a throwaway file, and the website's own address as it is on a PC
process.env.DISCORD_BOT_SETTINGS_PATH = join(mkdtempSync(join(tmpdir(), 'sfd-bot-')), 'settings.json');
process.env.DISCORD_WEBSITE_URL = 'http://localhost:8000';
process.env.DISCORD_STATUS_URL = '${APP_URL}';

const { presenceText, publicAddress, siteUrl, statusUrl } = await import('../config/index.js');
const { commands, commandsByName } = await import('../commands/index.js');
const { buttons, handlerFor, modals } = await import('../components/index.js');
const { events } = await import('../events/index.js');
const { botSettings, loadBotSettings, updateGuildSetting } = await import('../lib/settings.js');

test('a local address is never shown or linked: the bot says it belongs to the live site', () => {
    assert.equal(siteUrl, 'https://sfd-dj.eu');
    assert.equal(statusUrl, 'https://sfd-dj.eu');
    assert.equal(presenceText, 'https://sfd-dj.eu/');
});

test('publicAddress takes a public web address and nothing else', () => {
    assert.equal(publicAddress('https://sfd-dj.eu/'), 'https://sfd-dj.eu');
    assert.equal(publicAddress('https://example.com/app///'), 'https://example.com/app');
    for (const value of ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://192.168.1.20', 'http://10.0.0.5', 'http://[::1]:8000', 'http://sfd.test', '${APP_URL}', 'sfd-dj.eu', 'ftp://sfd-dj.eu', '', undefined]) {
        assert.equal(publicAddress(value), null, String(value));
    }
});

test('every slash command has a name, a valid definition and a handler', () => {
    assert.ok(commands.length > 0);
    assert.equal(commandsByName.size, commands.length, 'no two commands share a name');
    for (const { data, execute } of commands) {
        assert.equal(typeof execute, 'function', data.name);
        assert.ok(data.toJSON().description, data.name);
    }
});

test('a button or form goes to the handler of its id, and an exact id beats a prefix', () => {
    const start = handlerFor(buttons, 'staff-application:start');
    const review = handlerFor(buttons, 'staff-application:approve:123:456');
    assert.ok(start && review && start !== review);
    assert.equal(handlerFor(buttons, 'staff-application:reject:123:none'), review);
    assert.ok(handlerFor(buttons, 'ticket:open'));
    assert.ok(handlerFor(buttons, 'ticket:close:123456789012345678'));
    assert.ok(handlerFor(buttons, 'giveaway:enter'));
    assert.ok(handlerFor(modals, 'ticket:submit'));
    assert.ok(handlerFor(modals, 'staff-application:submit'));
    assert.ok(handlerFor(modals, 'info:save:add:rules:123'));
    assert.equal(handlerFor(buttons, 'something:else'), undefined);
});

test('the bot listens to the events it needs, the ready one only once', () => {
    assert.deepEqual(events.map((event) => event.name).sort(), ['clientReady', 'guildMemberAdd', 'guildMemberRemove', 'guildMemberUpdate', 'interactionCreate']);
    assert.equal(events.find((event) => event.name === 'clientReady').once, true);
});

test('what a server sets up is saved to the settings file and read back', async () => {
    await updateGuildSetting('123', 'boostChannelId', '456');
    await updateGuildSetting('123', 'partners', [{ name: 'Borealise', url: 'https://example.com', description: 'a partner' }]);
    await loadBotSettings();
    assert.equal(botSettings['123'].boostChannelId, '456');
    assert.equal(botSettings['123'].partners[0].name, 'Borealise');
});
