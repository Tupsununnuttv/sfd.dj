# Security review — 18 October 2026

This is a focused source review of browser authentication, password recovery, account changes, session revocation, response headers and installed dependencies. It is not a penetration test of the deployed website or its hosting environment.

## Changes applied

- Login failures for a username and its email now share the same per-account/IP attempt budget. Changing letter case or switching identifiers no longer grants another five attempts. Login input sizes are bounded before authentication.
- Password recovery returns the same public response for existing, unknown and token-throttled accounts and mail failures. Delivery errors are logged privately. Local development reset links retain their existing loopback/local-environment restriction.
- Email changes now revoke other sessions, remember-me credentials and personal API tokens. The current authenticated session is rotated and retained; the new address still requires verification.

The password broker already applies a minimum response time. Mail delivery is synchronous, so slow SMTP can still create a timing difference; a future queued recovery flow should include the account lookup as well as delivery to reduce that side channel. Monitor mail delivery failures because the public recovery response deliberately does not reveal them.

## Existing protections inspected

- Password hashing, CSRF protection and session rotation on authentication.
- TOTP login challenges with expiration, cross-session attempt limits and single-use authenticator/recovery codes.
- Password confirmation for email changes and 2FA setup; password plus a second factor for disabling 2FA.
- Revocation of old sessions, remember tokens and API tokens after password changes or resets.
- Private whisper recording access checks, random media filenames, response MIME protection and authenticated deletion permissions.
- Same-origin framing, HSTS over HTTPS, no-store responses for private pages and basic CSP directives.

The current CSP does not restrict script sources; it is not a complete XSS defense. A stricter nonce-based script policy needs integration with Vite, Inertia, music embeds and the payment flow before enforcement.

## Dependency checks

`composer audit --format=json --no-interaction`, `npm audit --omit=dev --json`, and `npm --prefix bot audit --omit=dev --json` reported no known advisories at review time. The npm checks cover production dependencies only. These results do not prove that application code or dependencies are free of vulnerabilities.

## Production requirements to verify on the server

1. Serve only the Laravel `public/` directory. Keep `.env`, database dumps, logs, source configuration and private uploads outside the public document root.
2. Use HTTPS, `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://sfd-dj.eu`, secure HttpOnly session cookies and SameSite=Lax. Never use a local environment configuration on the public server.
3. Restrict direct access to the application server behind its proxy and configure the actual trusted proxy addresses. Review forwarded-header handling against the hosting topology.
4. Use a working mail transport and require email verification. Monitor failed recovery emails and suspicious login activity.
5. Enable 2FA for owner/admin/staff accounts and retain recovery codes offline. Mandatory staff 2FA or passkeys should be introduced with an enrollment/recovery plan to avoid accidental lockout.
6. Use unique passwords from a password manager. New password rules currently inherit Laravel's minimum of eight characters; increasing the minimum to 15 and adding breached-password screening is recommended, with matching frontend guidance and recovery tests.
7. Keep encrypted backups of the database and private uploads, and test restoration. Keep backup encryption keys separately and restrict access to application/provider secrets.
8. Apply dependency and operating-system security updates regularly. Protect administrative hosting/Discord/email accounts with MFA as well.

Do not rotate `APP_KEY` casually: account authenticator secrets and provider credentials use application encryption. Key rotation requires a data migration/recovery plan.

## Guidance

- [OWASP password recovery](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [OWASP authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
