/** Keep test sources in a local archive; materialize them only while testing. */
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, renameSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const identity = createHash('sha256').update(process.platform === 'win32' ? root.toLowerCase() : root).digest('hex').slice(0, 12);
const archive = resolve(process.env.SFD_TEST_ARCHIVE || join(process.env.LOCALAPPDATA || join(homedir(), '.cache'), 'SFD-DJ', 'test-suites', `${basename(root)}-${identity}`, 'tests.tar.gz'));
const cacheRelative = relative(root, archive);
if (!cacheRelative.startsWith(`..${sep}`) && !isAbsolute(cacheRelative)) throw new Error('The test archive must live outside the website directory.');

function run(command, args, capture = false) {
    const result = spawnSync(command, args, { cwd: root, env: process.env, stdio: capture ? 'pipe' : 'inherit', encoding: 'utf8' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${command} exited with status ${result.status ?? result.signal}.`);
    return result.stdout || '';
}
function checkArchive(file) {
    const entries = run('tar', ['-tzf', file], true).trim().split(/\r?\n/);
    if (!entries.length || entries.some(entry => !entry.startsWith('tests/') || entry.split(/[\\/]/).includes('..'))) throw new Error('Unexpected paths in the test archive.');
}
function noLinks(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (lstatSync(path).isSymbolicLink()) throw new Error(`Refusing a linked test source: ${path}`);
        if (entry.isDirectory()) noLinks(path);
    }
}
function saveSources() {
    const tests = join(root, 'tests');
    if (!existsSync(tests)) return;
    if (lstatSync(tests).isSymbolicLink()) throw new Error('Refusing a linked tests directory.');
    noLinks(tests);
    mkdirSync(dirname(archive), { recursive: true });
    const next = `${archive}.next`;
    run('tar', ['-czf', next, '-C', root, 'tests']);
    checkArchive(next);
    renameSync(next, archive);
}
function restoreSources() {
    if (existsSync(join(root, 'tests'))) return;
    if (!existsSync(archive)) throw new Error(`Test sources are not installed. Restore the developer archive at ${archive}, or set SFD_TEST_ARCHIVE to its location.`);
    checkArchive(archive);
    run('tar', ['-xzf', archive, '-C', root]);
}
function clean() {
    // Check every absolute target before removing any of the three named directories.
    const targets = ['tmp', 'tests', 'test-results'].map(name => join(root, name));
    for (const target of targets) {
        if (dirname(target) !== root || !['tmp', 'tests', 'test-results'].includes(basename(target))) throw new Error(`Unexpected cleanup target: ${target}`);
        if (existsSync(target) && (lstatSync(target).isSymbolicLink() || realpathSync(target) !== target)) throw new Error(`Refusing a linked cleanup target: ${target}`);
    }
    for (const target of targets) rmSync(target, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 });
}

const [mode, ...args] = process.argv.slice(2);
const commands = {
    frontend: [process.execPath, '--test', 'tests/Frontend/*.test.mjs'],
    browsers: [process.execPath, 'node_modules/@playwright/test/cli.js', 'test'],
    mobile: [process.execPath, 'node_modules/@playwright/test/cli.js', 'test', '--config', 'playwright.mobile.config.mjs'],
    php: ['php', 'artisan', 'test'],
};
try {
    if (mode === 'archive') { saveSources(); console.log(`Test source archive: ${archive}`); }
    else if (mode === 'prepare') { restoreSources(); console.log('Test sources restored for an active test/editing session. Run a test command or clean when finished.'); }
    else if (mode === 'clean') { saveSources(); clean(); }
    else {
        if (mode !== 'exec' && !Object.hasOwn(commands, mode)) throw new Error('Unknown test command. Use frontend, browsers, mobile, php or exec.');
        const command = mode === 'exec' ? args : [...commands[mode], ...args];
        if (!command.length) throw new Error('Use frontend, browsers, mobile, php, exec <command> [args], prepare, archive or clean.');
        restoreSources();
        try { run(command[0], command.slice(1)); }
        finally { saveSources(); clean(); }
    }
} catch (error) { console.error(error.message); process.exitCode = 1; }
