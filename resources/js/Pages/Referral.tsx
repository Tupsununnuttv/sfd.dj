import Avatar from '@/Components/Avatar';
import RoleBadge from '@/Components/RoleBadge';
import { Card, EmptyState, ghostBtn, ProgressBar, SectionTitle, StatTile } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { ago } from '@/lib/time';
import { RoleInfo } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Check, Copy, Gift, Mail, Share2, Trophy, UserPlus, Zap } from 'lucide-react';
import { useState } from 'react';

interface Props {
    link: string;
    code: string;
    reward: number;
    referrals: { id: number; name: string; avatar: string | null; level: number; created_at: string; primary_role: RoleInfo }[];
    topInviters: { id: number; name: string; avatar: string | null; count: number }[];
    rank: number | null;
}

const MILESTONES = [1, 5, 10, 25, 50];

const steps = [
    [UserPlus, 'Share your link', 'Send it to friends, post it in your Discord, put it in your bio.'],
    [Gift, 'They register', 'They sign up through your link. It works once their account exists.'],
    [Zap, 'You get XP', 'The XP lands on your account right away. No limit on how many you invite.'],
] as const;

export default function Referral({ link, code, reward, referrals, topInviters, rank }: Props) {
    const [copied, setCopied] = useState<'link' | 'code' | null>(null);
    const count = referrals.length;
    const next = MILESTONES.find((m) => m > count) ?? null;
    const prev = [...MILESTONES].reverse().find((m) => m <= count) ?? 0;

    const copy = async (what: 'link' | 'code') => {
        await navigator.clipboard?.writeText(what === 'link' ? link : code).catch(() => {});
        setCopied(what);
        setTimeout(() => setCopied(null), 2000);
    };

    const text = `Come listen to music with me on SFD-DJ.EU: live rooms where everyone hears the same song at the same second.`;
    const share = () => navigator.share?.({ title: 'SFD-DJ.EU', text, url: link }).catch(() => {});
    const targets: [string, string][] = [
        ['WhatsApp', `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`],
        ['Telegram', `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`],
        ['X', `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`],
        ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`],
    ];

    return (
        <AppLayout title="Invite & earn" subtitle={<>Bring friends to SFD-DJ.EU. Every friend who registers with your link gives you <span className="font-semibold text-violet-300">{reward} XP</span>.</>}>
            <Head title="Referral" />

            {/* the link */}
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-600/25 via-violet-600/15 to-sky-600/10 p-6 sm:p-8">
                <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
                <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-200">Your personal invite link</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input readOnly value={link} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 rounded-xl border-white/10 bg-black/30 font-mono text-sm text-neutral-100" />
                        <button onClick={() => copy('link')} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-semibold transition hover:opacity-90">
                            {copied === 'link' ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy link</>}
                        </button>
                    </div>
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-neutral-300">
                        Or share just your code
                        <button onClick={() => copy('code')} className="rounded-md bg-black/30 px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-white hover:bg-black/50">{copied === 'code' ? 'Copied' : code}</button>
                        <span className="text-xs text-neutral-400">(they add <code>?ref={code}</code> to the register address)</span>
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {typeof navigator !== 'undefined' && 'share' in navigator && (
                            <button onClick={share} className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"><Share2 size={15} /> Share…</button>
                        )}
                        {targets.map(([name, href]) => (
                            <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">{name}</a>
                        ))}
                        <a href={`mailto:?subject=${encodeURIComponent('Join me on SFD-DJ.EU')}&body=${encodeURIComponent(`${text}\n\n${link}`)}`} className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"><Mail size={15} /> Email</a>
                    </div>
                </div>
            </section>

            {/* numbers */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile icon={UserPlus} tone="violet" label="Friends invited" value={count} />
                <StatTile icon={Zap} tone="amber" label="XP earned" value={(count * reward).toLocaleString()} />
                <StatTile icon={Trophy} tone="fuchsia" label="Inviter rank" value={rank ? `#${rank}` : '–'} hint={rank ? undefined : 'Invite someone to get ranked'} />
                <StatTile icon={Gift} tone="emerald" label="Per friend" value={`+${reward} XP`} />
            </div>

            {/* milestones */}
            <Card className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-semibold">{next ? `Next stop: ${next} ${next === 1 ? 'friend' : 'friends'}` : 'You reached every milestone 🎉'}</h2>
                    <span className="text-sm text-neutral-400">{count} invited{next ? `, ${next - count} to go (+${(next - count) * reward} XP)` : ''}</span>
                </div>
                <ProgressBar className="mt-3" value={next ? ((count - prev) / (next - prev)) * 100 : 100} />
                <div className="mt-3 flex justify-between text-xs">
                    {MILESTONES.map((m) => (
                        <span key={m} className={count >= m ? 'font-semibold text-violet-300' : 'text-neutral-500'}>{count >= m ? '✓ ' : ''}{m}</span>
                    ))}
                </div>
            </Card>

            {/* how it works */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {steps.map(([Icon, title, text2], i) => (
                    <Card key={title} className="p-5">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-violet-300"><Icon size={18} /></span>
                            <span className="text-xs font-bold text-neutral-500">STEP {i + 1}</span>
                        </div>
                        <h3 className="mt-3 font-semibold">{title}</h3>
                        <p className="mt-1 text-sm text-neutral-400">{text2}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="lg:col-span-2">
                    <SectionTitle title={`Friends you invited (${count})`} />
                    {count === 0 ? (
                        <EmptyState icon="💌" title="Nobody yet" text="Copy your link above and send it to someone. They will show up here as soon as they register." />
                    ) : (
                        <Card className="divide-y divide-white/5">
                            {referrals.map((r) => (
                                <Link key={r.id} href={route('users.show', r.id)} className="flex items-center gap-3 p-3 text-sm hover:bg-white/[0.03]">
                                    <Avatar name={r.name} avatar={r.avatar} />
                                    <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                                    <RoleBadge role={r.primary_role} />
                                    <span className="text-xs text-neutral-400">Lv {r.level}</span>
                                    <span className="hidden text-xs text-neutral-500 sm:inline">joined {ago(r.created_at)}</span>
                                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-300">+{reward} XP</span>
                                </Link>
                            ))}
                        </Card>
                    )}
                </section>

                <section>
                    <SectionTitle title="Top inviters" />
                    <Card className="divide-y divide-white/5">
                        {topInviters.length === 0 && <p className="p-4 text-sm text-neutral-500">Nobody has invited anyone yet. Be the first!</p>}
                        {topInviters.map((p, i) => (
                            <Link key={p.id} href={route('users.show', p.id)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.03]">
                                <span className="w-5 text-center">{['🥇', '🥈', '🥉'][i] ?? <span className="text-xs text-neutral-500">{i + 1}</span>}</span>
                                <Avatar name={p.name} avatar={p.avatar} className="h-7 w-7 text-sm" />
                                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                                <span className="text-xs text-neutral-400">{p.count} invited</span>
                            </Link>
                        ))}
                    </Card>
                    <Link href={route('friends')} className={`${ghostBtn} mt-4 block text-center`}>Go to Friends</Link>
                </section>
            </div>
        </AppLayout>
    );
}
