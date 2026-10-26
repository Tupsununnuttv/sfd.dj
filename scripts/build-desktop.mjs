import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTools, prepareInstallerTools, run } from './desktop-installer-tools.mjs';
import { desktopAssets } from './desktop-assets.mjs';

if (process.platform !== 'win32') throw new Error('Build the Windows installer on Windows with the .NET 10 SDK.');
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const signed = Boolean(process.env.SFD_SIGN_CERT_THUMBPRINT);
if (process.argv.includes('--require-signing') && !signed) throw new Error('A signed release requires SFD_SIGN_CERT_THUMBPRINT. See docs/desktop-signing.md.');
const signingScript = join(root, 'scripts/sign-desktop.ps1');
const sign = file => run('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', signingScript, ...(file ? ['-FilePath', file] : ['-CheckOnly'])]);
if (signed) sign();
else console.warn('Building an unsigned installer. SmartScreen warnings may appear. Use npm run desktop:build:release for a signed release.');
const version = readFileSync(join(root, 'apps/desktop/SfdDj.Desktop.csproj'), 'utf8').match(/<Version>([^<]+)<\/Version>/)?.[1];
if (!version) throw new Error('Desktop project version is missing.');
const tools = await prepareInstallerTools();
desktopAssets(root);
const artifacts = join(buildTools, 'desktop-artifacts');
const appDirectory = join(artifacts, 'publish/SfdDj.Desktop/release_win-x64');
if (existsSync(appDirectory)) {
    if (realpathSync(appDirectory) !== appDirectory || !appDirectory.startsWith(buildTools + '\\')) throw new Error('Unexpected desktop publish cleanup target.');
    rmSync(appDirectory, { recursive: true });
}
run('dotnet', ['publish', 'apps/desktop/SfdDj.Desktop.csproj', '-c', 'Release', '-r', 'win-x64', '--self-contained', 'false', '--artifacts-path', artifacts]);
// A global RuntimeFrameworkVersion also overrides the WinRT SDK reference pack.
// Set only the two shared .NET frameworks in the published host configuration.
const runtimeConfigPath = join(appDirectory, 'SFD-DJ-Desktop.runtimeconfig.json');
const runtimeConfig = JSON.parse(readFileSync(runtimeConfigPath, 'utf8'));
for (const framework of runtimeConfig.runtimeOptions.frameworks) {
    if (['Microsoft.NETCore.App', 'Microsoft.WindowsDesktop.App'].includes(framework.name)) framework.version = tools.runtimeVersion;
}
writeFileSync(runtimeConfigPath, JSON.stringify(runtimeConfig, null, 2) + '\n');
if (signed) sign(join(appDirectory, 'SFD-DJ-Desktop.exe'));
const notices = ['SFD DJ Desktop — third-party notices\n\nSFD DJ Desktop uses the Microsoft WebView2 SDK and contains a Microsoft-signed Evergreen WebView2 bootstrapper. Setup is built with Inno Setup. Microsoft .NET Desktop Runtime and Visual C++ Redistributable are downloaded from Microsoft only when needed, under their respective Microsoft license terms.\n'];
notices.push('\nWindows SDK for .NET / Microsoft.Windows.SDK.NET.dll and WinRT.Runtime.dll\nCopyright Microsoft Corporation. All rights reserved.\nWindows SDK license: https://aka.ms/WinSDKLicenseURL\nC#/WinRT source and license: https://github.com/microsoft/CsWinRT/blob/master/LICENSE\n');
const assets = JSON.parse(readFileSync(join(artifacts, 'obj/SfdDj.Desktop/project.assets.json'), 'utf8'));
for (const name of Object.keys(assets.libraries).filter(name => name.startsWith('Microsoft.Web.WebView2/'))) {
    const folder = Object.keys(assets.packageFolders).map(base => join(base, name.toLowerCase())).find(existsSync);
    if (!folder) throw new Error(`Missing license package: ${name}`);
    for (const file of readdirSync(folder).filter(file => /^(LICENSE(?:\.TXT)?|NOTICE\.TXT|THIRD-PARTY-NOTICES\.TXT)$/i.test(file))) {
        notices.push(`\n\n===== ${name} / ${file} =====\n\n${readFileSync(join(folder, file), 'utf8')}`);
    }
}
notices.push(`\n\n===== Inno Setup license =====\n\n${readFileSync(join(dirname(tools.compiler), 'License.txt'), 'utf8')}`);
writeFileSync(join(appDirectory, 'THIRD-PARTY-NOTICES.txt'), notices.join('') + '\n');
const include = join(buildTools, 'desktop-prerequisites.iss');
const definitions = {
    DotNetVersion: tools.runtimeVersion, VcVersion: tools.vcVersion,
    DotNetUrl: tools.sources.dotnet.url, DotNetHash: tools.sources.dotnet.sha256,
    VcUrl: tools.sources.vc.url, VcHash: tools.sources.vc.sha256,
    WebViewUrl: tools.sources.webview.url, WebViewHash: tools.sources.webview.sha256,
};
for (const value of Object.values(definitions)) if (/["\r\n]/.test(value)) throw new Error('Invalid installer definition.');
writeFileSync(include, Object.entries(definitions).map(([key, value]) => `#define ${key} "${value}"`).join('\n') + '\n');
const outputDirectory = join(buildTools, 'desktop-setup');
const signingArguments = signed ? ['/DSignedRelease', `--signtool=sfd_release=powershell.exe -NoProfile -NonInteractive -File $q${signingScript.replaceAll('$', '$$')}$q -FilePath $f`] : [];
run(tools.compiler, [`/DAppVersion=${version}`, `/DPayloadDir=${appDirectory}`, `/DPrerequisiteInclude=${include}`, `/DOutputDir=${outputDirectory}`, ...signingArguments, 'apps/desktop/Installer/Setup.iss']);
const executable = join(outputDirectory, 'SFD-DJ-Setup.exe');
const bytes = readFileSync(executable);
if (bytes.toString('ascii', 0, 2) !== 'MZ') throw new Error('Desktop build did not produce a Windows installer.');
const target = join(root, 'public/downloads/SFD-DJ-Setup.exe');
mkdirSync(dirname(target), { recursive: true });
copyFileSync(executable, `${target}.next`);
renameSync(`${target}.next`, target);
// Keep previously shared download URLs working; both URLs now deliver Setup.
copyFileSync(target, join(root, 'public/downloads/SFD-DJ-Desktop.exe'));
const release = {
    version, kind: 'installer', platform: 'windows11-x64', minimum_os: 'Windows 11', minimum_windows_build: 22000,
    signing: { status: signed ? 'signed' : 'unsigned' },
    file: '/downloads/SFD-DJ-Setup.exe', download_name: 'SFD-DJ-Setup.exe',
    bytes: statSync(target).size, sha256: createHash('sha256').update(bytes).digest('hex'),
    dependencies: { dotnet_desktop: tools.runtimeVersion, visual_cpp: tools.vcVersion, webview2: 'Evergreen' },
    site: 'https://sfd-dj.eu/', built_at: new Date().toISOString(),
};
writeFileSync(join(root, 'public/downloads/desktop-release.json'), JSON.stringify(release, null, 2) + '\n');
for (const file of ['SFD-DJ-Setup.exe', 'SFD-DJ-Desktop.exe']) writeFileSync(join(root, 'public/downloads', `${file}.sha256`), `${release.sha256}  ${file}\n`);
writeFileSync(join(root, 'public/downloads/SFD-DJ-Desktop-NOTICES.txt'), notices.join('') + '\n');
writeFileSync(join(buildTools, 'desktop-build-state.json'), JSON.stringify({ appDirectory, include, outputDirectory, version, tools }, null, 2) + '\n');
console.log(`Setup ${release.version}: ${(release.bytes / 1048576).toFixed(1)} MB; .NET ${tools.runtimeVersion}; VC++ ${tools.vcVersion}; SHA-256 ${release.sha256}`);
