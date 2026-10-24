# Tests outside the release directory

The website and production build do not need `tests`, `tmp` or `test-results`. Test sources are stored as a small local `tests.tar.gz` archive outside this project, under the user's application-data directory (`SFD-DJ/test-suites`). Reports, screenshots and fixture databases are temporary.

Use `npm run test:frontend`, `npm run test:browsers`, `npm run test:browsers:mobile` or `composer test`. The wrapper restores the test sources when testing begins, runs the requested checks, saves any test-source changes back to the archive and removes all three project directories when the command finishes, including a failing check. Run test commands one at a time. `npm run build` and normal site operation never restore test directories.

Additional arguments are forwarded, for example:

```powershell
npm run test:browsers:mobile -- --project=chromium
composer test -- --filter=SettingsUpgradeTest
```

For other developer test commands, use `node scripts/test-workspace.mjs exec <command> [arguments]`. Historical documentation's `tests/...` paths refer to this archived source. Browser reports are removed at the end of a run; inspect any needed diagnostics during the test session or save selected evidence outside the release directory.

When editing or adding tests, first run `node scripts/test-workspace.mjs prepare` to restore the complete existing suite. Do not create a partial replacement `tests` directory from scratch. Run a test command when finished, or use `node scripts/test-workspace.mjs clean` after a manual multi-step test session. Both save test-source changes before cleanup.

`node scripts/test-workspace.mjs archive` saves existing test sources and prints the archive location. `node scripts/test-workspace.mjs clean` archives sources before removing the three directories. The archive stays outside the release: do not upload it with the website. A different development machine can use a copy of the archive via `SFD_TEST_ARCHIVE`. Production does not need the archive, test tools or test directories.
