import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export const buildTools = resolve(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'SFD-DJ', 'build-tools');
export function run(command, args, capture = false) {
    const result = spawnSync(command, args, { stdio: capture ? 'pipe' : 'inherit', encoding: 'utf8', windowsHide: true });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${command} failed (${result.status}): ${capture ? result.stderr : ''}`);
    return result.stdout?.trim();
}
async function download(url, file, hash = null, refresh = false) {
    if (!existsSync(file) || !existsSync(`${file}.source.json`) || refresh) {
        const response = await fetch(url, { signal: AbortSignal.timeout(180000) });
        if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.toString('ascii', 0, 2) !== 'MZ') throw new Error('Expected a Windows executable.');
        if (hash && createHash('sha512').update(bytes).digest('hex') !== hash.toLowerCase()) throw new Error('Microsoft .NET installer SHA-512 mismatch.');
        writeFileSync(file, bytes);
        writeFileSync(`${file}.source.json`, JSON.stringify({ url: response.url, sha256: createHash('sha256').update(bytes).digest('hex') }) + '\n');
    }
    if (hash && createHash('sha512').update(readFileSync(file)).digest('hex') !== hash.toLowerCase()) throw new Error('Cached .NET installer SHA-512 mismatch.');
    const source = JSON.parse(readFileSync(`${file}.source.json`, 'utf8'));
    if (createHash('sha256').update(readFileSync(file)).digest('hex') !== source.sha256) throw new Error('Cached installer SHA-256 mismatch.');
}
export function signedVersion(file, publisher) {
    const literal = file.replaceAll("'", "''");
    return JSON.parse(run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
        `$s = Get-AuthenticodeSignature -LiteralPath '${literal}'; if ($s.Status -ne 'Valid' -or $s.SignerCertificate.Subject -notmatch '${publisher}') { throw 'Invalid installer publisher signature.' }; $v = (Get-Item -LiteralPath '${literal}').VersionInfo; @{version=('{0}.{1}.{2}.{3}' -f $v.FileMajorPart,$v.FileMinorPart,$v.FileBuildPart,$v.FilePrivatePart)} | ConvertTo-Json -Compress`], true));
}

export async function prepareInstallerTools() {
    mkdirSync(buildTools, { recursive: true });
    const metadataResponse = await fetch('https://builds.dotnet.microsoft.com/dotnet/release-metadata/10.0/releases.json');
    if (!metadataResponse.ok) throw new Error('Could not read Microsoft .NET release metadata.');
    const metadata = await metadataResponse.json();
    const runtimeVersion = metadata['latest-runtime'];
    if (!/^10\.0\.\d+$/.test(runtimeVersion)) throw new Error('Expected a stable .NET 10 runtime.');
    const release = metadata.releases.find(release => release.windowsdesktop?.version === runtimeVersion);
    const runtimeFile = release?.windowsdesktop.files.find(file => file.rid === 'win-x64' && file.name.endsWith('.exe'));
    if (!runtimeFile || new URL(runtimeFile.url).hostname !== 'builds.dotnet.microsoft.com') throw new Error('Unexpected .NET Desktop Runtime download.');
    const dotnet = join(buildTools, `windowsdesktop-runtime-${runtimeVersion}-win-x64.exe`);
    await download(runtimeFile.url, dotnet, runtimeFile.hash);
    signedVersion(dotnet, 'O=Microsoft Corporation');

    const vc = join(buildTools, 'vc_redist.x64.exe');
    await download('https://aka.ms/vc14/vc_redist.x64.exe', vc, null, existsSync(vc) && Date.now() - statSync(vc).mtimeMs > 86400000);
    const vcVersion = signedVersion(vc, 'O=Microsoft Corporation').version;
    const webview = join(buildTools, 'MicrosoftEdgeWebView2Setup.exe');
    await download('https://go.microsoft.com/fwlink/p/?LinkId=2124703', webview);
    signedVersion(webview, 'O=Microsoft Corporation');

    const innoDirectory = join(buildTools, 'inno-7.1.0');
    const compiler = join(innoDirectory, 'ISCC.exe');
    if (!existsSync(compiler)) {
        const setup = join(buildTools, 'innosetup-7.1.0-x64.exe');
        await download('https://github.com/jrsoftware/issrc/releases/download/is-7_1_0/innosetup-7.1.0-x64.exe', setup);
        signedVersion(setup, 'Pyrsys');
        run(setup, ['/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART', '/CURRENTUSER', '/NOICONS', '/TASKS=', `/DIR=${innoDirectory}`]);
        if (!existsSync(compiler)) throw new Error('Inno Setup compiler was not installed.');
    }
    const source = file => JSON.parse(readFileSync(`${file}.source.json`, 'utf8'));
    // Earlier builds may have cached the WebView2 bootstrapper without source metadata.
    if (!existsSync(`${webview}.source.json`)) await download('https://go.microsoft.com/fwlink/p/?LinkId=2124703', webview, null, true);
    const result = { compiler, dotnet, runtimeVersion, vc, vcVersion, webview, sources: { dotnet: source(dotnet), vc: source(vc), webview: source(webview) } };
    writeFileSync(join(buildTools, 'desktop-prerequisites.json'), JSON.stringify(result, null, 2) + '\n');
    return result;
}

if (process.argv.includes('--prepare')) {
    const tools = await prepareInstallerTools();
    console.log(JSON.stringify({ compiler: tools.compiler, dotnet: tools.runtimeVersion, vc: tools.vcVersion }));
}
