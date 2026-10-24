import { formatDate, formatDateTime } from '@/lib/regional';
import { copyText } from '@/lib/clipboard';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Check, Copy } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Token {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string;
}

interface Props {
    tokens: Token[];
    bots: { id: number; name: string; username: string; tokens: Token[] }[];
    newToken: { for: string; token: string } | null;
    api: string;
    /** Where the API answers, as [label, address]: the live site for everybody, and the Owner also gets the two of a copy on their own computer. */
    addresses: [string, string][];
}

const field = 'rounded-md border-neutral-700 bg-neutral-800 text-sm text-neutral-100 placeholder-neutral-500 focus:border-violet-500 focus:ring-violet-500';
const card = 'rounded-2xl border border-white/10 bg-white/4 p-5';
const primary = 'rounded-md bg-linear-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

function Address({ label, url, here }: { label: string; url: string; here: boolean }) {
    const [copied, setCopied] = useState(false);
    const copy = () => { void copyText(url).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); }).catch(() => {}); };

    return (
        <li className="flex items-center gap-3 py-2">
            <span className="w-36 shrink-0 text-xs text-neutral-500">{label}{here && <span className="ml-1 rounded bg-violet-500/20 px-1 text-[10px] font-semibold text-violet-300">this site</span>}</span>
            <code className="min-w-0 flex-1 truncate rounded bg-neutral-800 px-2 py-1 text-xs text-violet-300">{url}</code>
            <button onClick={copy} aria-label={`Copy ${url}`} className="flex shrink-0 items-center gap-1 rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700">
                {copied ? <><Check size={13} className="text-emerald-400" /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
        </li>
    );
}

function TokenList({ tokens }: { tokens: Token[] }) {
    if (tokens.length === 0) return <p className="text-sm text-neutral-500">No tokens.</p>;

    return (
        <ul className="divide-y divide-neutral-800 text-sm">
            {tokens.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                    <span>
                        {t.name} <span className="text-xs text-neutral-500">· made {formatDate(t.created_at)} · {t.last_used_at ? `last used ${formatDateTime(t.last_used_at)}` : 'never used'}</span>
                    </span>
                    <button onClick={() => confirm(`Delete the token "${t.name}"? Anything using it stops working.`) && router.delete(route('developers.tokens.destroy', t.id), { preserveScroll: true })} className="text-xs text-red-400 hover:underline">Delete</button>
                </li>
            ))}
        </ul>
    );
}

function NewToken({ name, botId }: { name?: string; botId?: number }) {
    const [label, setLabel] = useState('');
    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.post(route('developers.tokens.store'), { name: label, bot_id: botId }, { preserveScroll: true, onSuccess: () => setLabel('') });
    };

    return (
        <form onSubmit={submit} className="flex gap-2">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={`Token name${name ? ` for ${name}` : ''}, e.g. my laptop`} maxLength={40} className={`${field} flex-1`} />
            <button disabled={!label.trim()} className="rounded-md bg-neutral-800 px-3 text-sm hover:bg-neutral-700 disabled:opacity-50">New token</button>
        </form>
    );
}

/** Settings → Developers: bots and API tokens for the SFD-DJ.EU API. */
export default function Developers({ tokens, bots, newToken, api, addresses }: Props) {
    const [name, setName] = useState('');
    const errors = usePage().props.errors as Record<string, string>;

    const makeBot = (e: FormEvent) => {
        e.preventDefault();
        router.post(route('developers.bots.store'), { name }, { preserveScroll: true, onSuccess: () => setName('') });
    };

    return (
        <SettingsLayout title="Developers" subtitle="Bots, API tokens and the npm package for SFD-DJ.EU.">
            <Head title="Developers" />

            <div className="max-w-3xl space-y-6">
                <p className="text-sm text-neutral-400">
                    Build room bots, browser extensions and tools on the SFD-DJ.EU API.
                    Install the helper library with <code className="rounded bg-neutral-800 px-1 text-violet-300">npm install sfddj</code>. See Docs → Developers for every endpoint.
                </p>

                <section className={`${card} space-y-2`}>
                    <h2 className="font-semibold">API addresses</h2>
                    <p className="text-sm text-neutral-400">The same API answers on each of these. With the library, give it the site without <code className="rounded bg-neutral-800 px-1 text-violet-300">/api/v1</code> as <code className="rounded bg-neutral-800 px-1 text-violet-300">baseUrl</code>.</p>
                    <ul className="divide-y divide-neutral-800">
                        {!addresses.some(([, url]) => url === api) && <Address label="This site" url={api} here />}
                        {addresses.map(([label, url]) => <Address key={url} label={label} url={url} here={url === api} />)}
                    </ul>
                </section>

                {newToken && (
                    <div className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5">
                        <p className="text-sm font-semibold text-amber-200">New token for {newToken.for}: copy it now. It is shown only once.</p>
                        <input readOnly value={newToken.token} onFocus={(e) => e.target.select()} className={`${field} w-full font-mono`} />
                        <p className="text-xs text-amber-200/70">Treat it like a password: anyone who has it can act as {newToken.for}. Never put it in a public repository or in a browser extension you share.</p>
                    </div>
                )}

                <section className={`${card} space-y-3`}>
                    <h2 className="font-semibold">Bots</h2>
                    <p className="text-sm text-neutral-400">A bot is its own account with a 🤖 badge. Nobody can log in as it; it only works through its tokens. Give it a role in your room (Room settings → Roles) to let it moderate or manage the queue.</p>
                    <form onSubmit={makeBot} className="flex gap-2">
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bot name, e.g. DJ Helper" maxLength={30} className={`${field} flex-1`} />
                        <button disabled={name.trim().length < 2} className={primary}>Create bot</button>
                    </form>
                    {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}

                    {bots.map((b) => (
                        <div key={b.id} className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold">🤖 {b.name} <span className="text-xs font-normal text-neutral-500">@{b.username}</span></p>
                                <button onClick={() => confirm(`Delete the bot "${b.name}" and its tokens?`) && router.delete(route('developers.bots.destroy', b.id), { preserveScroll: true })} className="text-xs text-red-400 hover:underline">Delete bot</button>
                            </div>
                            <TokenList tokens={b.tokens} />
                            <NewToken name={b.name} botId={b.id} />
                        </div>
                    ))}
                </section>

                <section className={`${card} space-y-3`}>
                    <h2 className="font-semibold">My personal tokens</h2>
                    <p className="text-sm text-neutral-400">These act as <em>you</em>, with all your rights. Good for your own scripts and browser extension. For anything public, use a bot.</p>
                    <TokenList tokens={tokens} />
                    <NewToken />
                </section>
            </div>
        </SettingsLayout>
    );
}
