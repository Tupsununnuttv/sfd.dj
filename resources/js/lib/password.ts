/** What a password has going for it. Only the length is a rule on the server; the rest is advice. */
export interface PasswordCheck {
    score: 0 | 1 | 2 | 3 | 4;
    label: string;
    checks: { ok: boolean; label: string; required?: boolean }[];
}

export function checkPassword(pw: string): PasswordCheck {
    const checks = [
        { ok: pw.length >= 8, label: 'At least 8 characters', required: true },
        { ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw), label: 'Upper and lower case letters' },
        { ok: /\d/.test(pw), label: 'A number' },
        { ok: /[^A-Za-z0-9]/.test(pw), label: 'A symbol, like ! or ?' },
        { ok: pw.length >= 12, label: '12 characters or more' },
    ];

    // too short is always weak; after that every extra habit adds a step
    const extras = checks.slice(1).filter((c) => c.ok).length;
    const score = (pw.length === 0 ? 0 : pw.length < 8 ? 1 : extras >= 3 ? 4 : extras === 2 ? 3 : 2) as PasswordCheck['score'];

    return { score, label: ['', 'Too weak', 'Okay', 'Good', 'Strong'][score], checks };
}
