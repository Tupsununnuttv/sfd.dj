import Avatar from '@/Components/Avatar';
import { card } from '@/Components/ui';
import { canSaveAccounts, forgetAccount, loadAccounts, SavedAccount } from '@/lib/savedAccounts';
import { ChevronDown, Copy, Eye, EyeOff, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * The accounts saved on this device, shown under the login and register forms.
 * Passwords stay hidden until you press the eye. `onUse` fills the form.
 */
export default function SavedAccounts({ onUse }: { onUse: (a: SavedAccount) => void }) {
    const [accounts, setAccounts] = useState<SavedAccount[] | null>(null);
    const [shown, setShown] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const refresh = () => loadAccounts().then(setAccounts);
    useEffect(() => {
        refresh();
    }, []);

    const copy = (a: SavedAccount) => {
        navigator.clipboard?.writeText(a.password).then(() => {
            setCopied(a.email);
            setTimeout(() => setCopied(null), 1500);
        });
    };

    return (
        <details className={`${card} group p-4`} open={!!accounts?.length}>
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-neutral-100">
                <ShieldCheck size={16} className="text-green-400" /> Accounts on this device
                {accounts !== null && <span className="rounded-full bg-white/10 px-2 text-xs font-bold text-neutral-300">{accounts.length}</span>}
                <ChevronDown size={16} className="ml-auto text-neutral-500 transition group-open:rotate-180" />
            </summary>

            <p className="mt-3 text-xs text-neutral-500">
                Only you can see this. It lives in this browser, is encrypted, and is never sent to the site or anyone else. Do not use it on a shared computer.
            </p>

            {!canSaveAccounts && <p className="mt-3 text-sm text-amber-300">This browser cannot store accounts safely, so saving is switched off.</p>}

            {canSaveAccounts && accounts !== null && accounts.length === 0 && (
                <p className="mt-3 rounded-lg border border-dashed border-white/15 p-3 text-sm text-neutral-400">
                    Nothing saved yet. Tick “Save this account on this device” when you log in or register and it will show up here.
                </p>
            )}

            <ul className="mt-3 space-y-3">
                {accounts?.map((a) => (
                    <li key={a.email} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                        <div className="flex items-center gap-3">
                            <Avatar name={a.name} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-neutral-100">{a.name}</p>
                                <p className="truncate text-xs text-neutral-500">@{a.username} · {a.email}</p>
                            </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                            <span className="text-neutral-500">Password</span>
                            <span className="flex min-w-0 items-center gap-2 text-neutral-300">
                                <span className="truncate font-mono">{shown === a.email ? a.password : '•'.repeat(Math.min(a.password.length, 12))}</span>
                                <button type="button" onClick={() => setShown(shown === a.email ? null : a.email)} title={shown === a.email ? 'Hide password' : 'Show password'} className="text-neutral-400 hover:text-white">
                                    {shown === a.email ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button type="button" onClick={() => copy(a)} title="Copy password" className="text-neutral-400 hover:text-white">
                                    {copied === a.email ? <span className="text-green-400">✓</span> : <Copy size={14} />}
                                </button>
                            </span>
                        </div>

                        <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => onUse(a)} className="flex-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold hover:bg-violet-500">Use</button>
                            <button
                                type="button"
                                onClick={() => confirm(`Forget ${a.email} on this device?`) && forgetAccount(a.email).then(refresh)}
                                title="Forget on this device"
                                className="rounded-lg bg-white/10 px-3 py-1.5 text-neutral-400 hover:bg-white/20 hover:text-red-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </details>
    );
}
