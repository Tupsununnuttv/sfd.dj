# Desktop downloads and signing

The download page allows browsers which cannot report the Windows version, including Firefox on Windows 10/11. It explains the Windows 11 requirement instead of disabling the download. Known unsupported systems still receive the existing disabled button. Setup independently enforces Windows build 22000 and compatible 64-bit architecture.

The current 1.4.0 installer is **unsigned**. Updating the website does not change that executable or remove its SmartScreen warning. Laravel Cloud response headers do not control Windows application trust. Version 1.3.0 added [desktop update notifications](desktop-updates.md); version 1.4.0 adds [Discord Rich Presence](desktop-discord-presence.md).

## Signed releases

Obtain a publicly trusted Authenticode code-signing certificate with its private key accessible through the Windows CurrentUser/My certificate store (for example through the certificate provider's hardware token). Install Windows SDK SignTool. Do not commit or upload private keys, tokens or passwords to the website.

In the Windows build environment, set the certificate's public thumbprint and build:

```powershell
$env:SFD_SIGN_CERT_THUMBPRINT = 'YOUR_40_CHARACTER_CERTIFICATE_THUMBPRINT'
# Optional if SignTool is installed outside the Windows SDK:
# $env:SFD_SIGNTOOL_PATH = 'C:\path\to\signtool.exe'
npm run desktop:build:release
```

This command fails before building if signing is unconfigured. The signing helper checks the certificate's validity, trust chain, code-signing usage and private key. It signs the app executable, and Inno Setup signs both Setup and the uninstaller. Every signing invocation uses SHA-256 and an RFC 3161 timestamp, then verifies the signature, timestamp and expected publisher certificate. Failed signing aborts the build before the public download is replaced. Checksums and release metadata are generated after signing.

`npm run desktop:build` remains available for local unsigned builds; it also signs when the environment variable is set. The download page displays signing information from the generated release metadata. A signed release has not been produced or tested against a real signing provider because no certificate is currently configured.

Signing identifies the publisher and allows reputation to accumulate; it cannot guarantee the immediate disappearance of SmartScreen warnings, including with an EV certificate. Microsoft Store distribution is the most reliable option for avoiding SmartScreen download prompts. Artifact Signing is another signing provider, but its account, identity validation and integration must be configured separately; the certificate-store helper does not configure it.

References: [Microsoft SmartScreen guidance](https://learn.microsoft.com/windows/apps/package-and-deploy/smartscreen-reputation), [Inno Setup signing](https://jrsoftware.org/ishelp/topic_setup_signtool.htm).

## Deployment and verification

Deploy the changed download page, platform helper, translations and release metadata through the connected repository. Run `npm run build` in the normal Laravel Cloud build. Rebuilding the installer is not needed for the Firefox fix. Keep `X-Content-Type-Options: nosniff` enabled.

After a future signed desktop build, publish the generated installer, its legacy download alias, both SHA-256 files and `desktop-release.json` together, then rebuild the web assets (the page imports release metadata at build time). Never edit an executable after signing.

Validation for the Firefox fix: production TypeScript/Vite build, 10 platform-detection checks, and production-bundle browser checks for Firefox on Windows (English and Spanish), Chromium on Windows 11, Chromium on Windows 10 and Firefox on macOS. Downloads in supported/unknown Windows cases were completed and their size and SHA-256 checked. Unsupported OS cases retained the disabled button. The signing script parsed successfully, Inno preprocessing enabled Setup/uninstaller signing, and the release build correctly rejected a missing certificate. A real signed build remains unverified without a certificate. The full historical test suite could not be restored from its incomplete external archive; focused checks were kept outside the workspace.
