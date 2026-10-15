import Avatar from '@/Components/Avatar';
import Badges from '@/Components/Badges';
import { CoinIcon, CoinPill } from '@/Components/CoinIcon';
import { RoleGlyph } from '@/Components/RoleIcon';
import { Card, chip, EmptyState, ghostBtn, primaryBtn, ProgressBar, Tabs } from '@/Components/ui';
import AppLayout from '@/Layouts/AppLayout';
import { characterOf, characterUrl } from '@/lib/characters';
import { Cosmetics, ShopBadge } from '@/lib/cosmetics';
import { levelPercent, toNextText } from '@/lib/level';
import { ago } from '@/lib/time';
import { PageProps, RoleInfo } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Award, Check, ChevronDown, Crown, Frame, Gift, Lock, RotateCcw, Save, Shuffle, Smile, Sparkles, Trophy, X } from 'lucide-react';
import { ReactNode, useState } from 'react';

type Slot = 'avatar' | 'badge' | 'accessory' | 'frame' | 'effect';
type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'staff';
type Item = { key: string; label: string; icon: string | null; level: number; rarity: Rarity; price: number; owned: boolean; character?: boolean; role?: { key: string; label: string; icon: string; color: string } };
type Look = Record<Slot, string | null>;
type Line = { amount: number; reason: string; note: string | null; at: string | null };

const slots: { slot: Slot; tab: string; one: string; icon: LucideIcon }[] = [
    { slot: 'avatar', tab: 'Avatars', one: 'Avatar', icon: Smile },
    { slot: 'badge', tab: 'Badges', one: 'Badge', icon: Award },
    { slot: 'accessory', tab: 'Accessories', one: 'Accessory', icon: Crown },
    { slot: 'frame', tab: 'Frames', one: 'Frame', icon: Frame },
    { slot: 'effect', tab: 'Effects', one: 'Effect', icon: Sparkles },
];

// full class names so Tailwind keeps them
const rarities: Record<Rarity, { label: string; levels: string; card: string; text: string }> = {
    common: { label: 'Common', levels: 'Levels 1 to 3', card: 'border-white/10 bg-white/4 hover:border-white/30', text: 'text-neutral-400' },
    rare: { label: 'Rare', levels: 'Levels 4 to 9', card: 'border-sky-400/25 bg-sky-500/6 hover:border-sky-400/60', text: 'text-sky-300' },
    epic: { label: 'Epic', levels: 'Levels 10 to 24', card: 'border-violet-400/30 bg-violet-500/9 hover:border-violet-400/70', text: 'text-violet-300' },
    legendary: { label: 'Legendary', levels: 'Level 25 and up', card: 'border-amber-400/40 bg-linear-to-br from-amber-500/[0.14] via-fuchsia-500/6 to-transparent hover:border-amber-300/80', text: 'text-amber-300' },
    staff: { label: 'Staff', levels: 'For people with a role: Brand Ambassador and above', card: 'border-pink-400/40 bg-linear-to-br from-pink-500/16 via-violet-500/8 to-transparent hover:border-pink-300/80', text: 'text-pink-300' },
};

const reasons: Record<string, string> = { level: 'New level', song: 'Song played', grab: 'Grab', daily: 'Daily reward', referral: 'Friend joined', shop: 'Shop', welcome: 'Welcome' };

const isPhoto = (avatar: string | null) => !!avatar?.startsWith('img:');
const isAnimated = (avatar: string | null) => !!avatar && (avatar.startsWith('anim:') || avatar.startsWith('char:'));
const buyBtn = 'flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition';

export default function Shop({ catalog, coins, daily, earn, history }: { catalog: Record<Slot, Item[]>; coins: number; daily: { amount: number; claimable: boolean }; earn: string[][]; history: Line[] }) {
    const { user } = usePage<PageProps>().props.auth;
    const level = user.level;
    const staff = user.is_staff;

    const saved: Look = { avatar: user.character ?? user.avatar, badge: user.cosmetics?.badge ?? null, accessory: user.cosmetics?.accessory ?? null, frame: user.cosmetics?.frame ?? null, effect: user.cosmetics?.effect ?? null };
    const [draft, setDraft] = useState<Look>(saved); // what is being tried on; only Save makes it real
    const [tab, setTab] = useState<Slot>('avatar');
    const [show, setShow] = useState<'all' | 'owned' | 'sale' | 'locked'>('all');
    const [pops, setPops] = useState(0);
    const [busy, setBusy] = useState(false);
    const [wallet, setWallet] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    // it is yours if you bought it (or it is free, or you are staff), and what you already wear stays yours
    const canWear = (slot: Slot, it: Item) => it.owned || saved[slot] === it.key;
    const find = (slot: Slot, key: string | null) => (key ? catalog[slot].find((i) => i.key === key) : undefined);
    const kindOf = (it: Item) => (it.owned ? 'owned' : it.level <= level ? 'sale' : 'locked');

    const changed = slots.filter(({ slot }) => draft[slot] !== saved[slot]);
    const blocked = slots.flatMap(({ slot }) => {
        const it = find(slot, draft[slot]);
        return it && !canWear(slot, it) ? [{ slot, it }] : [];
    });
    const buyable = blocked.filter(({ it }) => it.level <= level);
    const total = buyable.reduce((n, { it }) => n + it.price, 0);
    const worn: Cosmetics = { badge: draft.badge ?? undefined, accessory: draft.accessory ?? undefined, frame: draft.frame ?? undefined, effect: draft.effect ?? undefined };

    const all = slots.flatMap(({ slot }) => catalog[slot].map((it) => ({ slot, it })));
    const have = all.filter(({ it }) => it.owned).length;
    const above = all.map(({ it }) => it).filter((it) => !it.owned && it.level > level);
    const nextLevel = above.length ? Math.min(...above.map((it) => it.level)) : null;
    const nextItems = above.filter((it) => it.level === nextLevel);

    const pick = (slot: Slot, key: string | null) => {
        setDraft((d) => ({ ...d, [slot]: key }));
        setPops((n) => n + 1);
        setMessage(null);
    };
    const reset = () => {
        setDraft(saved);
        setMessage(null);
    };
    const surprise = () => {
        const any = (slot: Slot, odds = 1) => {
            const ok = catalog[slot].filter((it) => canWear(slot, it));
            return ok.length && Math.random() < odds ? ok[Math.floor(Math.random() * ok.length)].key : null;
        };
        // an uploaded photo is only replaced when you pick an avatar yourself
        setDraft({ avatar: isPhoto(draft.avatar) ? draft.avatar : any('avatar'), badge: any('badge', 0.8), accessory: any('accessory', 0.7), frame: any('frame', 0.8), effect: any('effect', 0.7) });
        setPops((n) => n + 1);
        setMessage(null);
    };
    const save = () => {
        const data: Record<string, string | null> = {};
        changed.forEach(({ slot }) => (data[slot] = draft[slot]));
        router.post(route('shop.outfit'), data, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
            onSuccess: () => setMessage({ ok: true, text: 'Saved. Your new look shows in chat, on the stage and in the user list.' }),
            onError: (errors) => setMessage({ ok: false, text: Object.values(errors)[0] ?? 'Could not save your look.' }),
        });
    };
    const buy = (things: { slot: Slot; it: Item }[]) => {
        const price = things.reduce((n, { it }) => n + it.price, 0);
        router.post(route('shop.buy'), { items: things.map(({ slot, it }) => ({ slot, key: it.key })) }, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
            onSuccess: () => setMessage({ ok: true, text: `Bought ${things.map(({ it }) => it.label).join(', ')} for ${price.toLocaleString()} SFD Coins. Put it on and save your look.` }),
            onError: (errors) => setMessage({ ok: false, text: Object.values(errors)[0] ?? 'Could not buy that.' }),
        });
    };
    const claim = () =>
        router.post(route('shop.daily'), {}, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
            onSuccess: () => setMessage({ ok: true, text: `+${daily.amount} SFD Coins. Come back tomorrow for more.` }),
            onError: (errors) => setMessage({ ok: false, text: Object.values(errors)[0] ?? 'Could not take the daily reward.' }),
        });

    const labelOf = (slot: Slot, key: string | null) =>
        slot === 'avatar' ? (key === null ? 'No character' : isPhoto(key) ? 'Your photo' : isAnimated(key) ? (find('avatar', key)?.label ?? 'Animated avatar') : 'Old avatar') : (find(slot, key)?.label ?? 'None');
    const iconOf = (slot: Slot, key: string | null): ReactNode =>
        slot === 'avatar'
            ? (isAnimated(key) ? <Avatar name={user.name} avatar={key} className="h-7 w-7 text-xs" /> : key && !isPhoto(key) ? key : null)
            : key && slot === 'badge' ? <ShopBadge name={key} className="h-6 w-6" />
            : key ? <Avatar name={user.name} avatar={draft.avatar} cosmetics={{ [slot]: key }} className="h-5 w-5 text-[10px]" />
            : null;

    const badgeItem = find('badge', draft.badge);
    const chatBadges: RoleInfo[] = [...user.badges.filter((b) => !b.key.startsWith('shop:')), ...(badgeItem ? [{ key: `shop:${badgeItem.key}`, label: badgeItem.label, color: '#a78bfa', icon: badgeItem.icon ?? undefined }] : [])];

    type Show = typeof show;
    const filters: [Show, string][] = [['all', 'All'], ['owned', 'Owned'], ['sale', 'For sale'], ['locked', 'Locked']];
    const items = catalog[tab].filter((it) => show === 'all' || kindOf(it) === show);
    const big = 'h-12 w-12 text-2xl';

    const preview = (it: Item) =>
        tab === 'avatar' && it.character ? (
            <span className="flex h-full items-end justify-center">
                <img src={characterUrl(characterOf(it.key)!, 'standing')} alt="" draggable={false} className="h-full group-hover/card:hidden" />
                <img src={characterUrl(characterOf(it.key)!, 'dancing')} alt="" draggable={false} loading="lazy" className="hidden h-full group-hover/card:block" />
            </span>
        ) : tab === 'avatar' ? (
            <Avatar name={user.name} avatar={it.key} className={big} />
        ) : tab === 'badge' ? (
            <ShopBadge name={it.key} className="h-14 w-14" />
        ) : (
            // frames, effects and accessories are tried on the avatar you are building
            <Avatar name={user.name} avatar={draft.avatar} cosmetics={{ [tab]: it.key }} className={big} />
        );

    /** The line under the name of an item: what you have, or what it needs. */
    const status = (it: Item) => {
        if (it.role) return <span className="inline-flex items-center gap-1" style={{ color: it.role.color }}><RoleGlyph role={it.role} /> {it.role.label}{it.role.key === 'owner' ? ' only' : '+'}</span>;
        const what = it.owned && it.price === 0 ? 'Free' : `Level ${it.level}`;
        return <>{it.character && <span className="text-sky-300">🕺 Character · </span>}{what}</>;
    };

    const card = (it: Item) => {
        const open = canWear(tab, it);
        const on = draft[tab] === it.key;
        const r = rarities[it.rarity];
        const lockedByLevel = !it.owned && it.level > level;
        const afford = coins >= it.price;

        return (
            <div key={it.key} data-item={it.key} className={`group/card relative flex min-w-0 flex-col rounded-2xl border text-center transition hover:-translate-y-0.5 ${r.card} ${on ? 'ring-2 ring-violet-400' : ''}`}>
                <button
                    onClick={() => pick(tab, it.key)}
                    aria-pressed={on}
                    title={open ? undefined : lockedByLevel ? `Needs level ${it.level}. Click to try it on.` : 'Click to try it on, then buy it to keep it.'}
                    className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-t-2xl p-3 pt-4"
                >
                    <div className={`mt-1 flex items-center justify-center ${it.character ? 'h-24' : 'h-18'} ${open ? '' : 'opacity-70 saturate-75'}`}>{preview(it)}</div>
                    <div className="min-w-0 max-w-full">
                        {it.label && <p className="truncate text-sm font-semibold">{it.label}</p>}
                        <p className={`text-[11px] font-semibold ${open ? r.text : 'text-neutral-500'}`}>{status(it)}</p>
                    </div>
                </button>
                {saved[tab] === it.key && <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">Worn</span>}
                {lockedByLevel && <Lock size={13} className="pointer-events-none absolute right-2 top-2 text-neutral-400" />}
                {on && open && <span className="pointer-events-none absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white"><Check size={11} strokeWidth={3} /></span>}
                <div className="min-h-11 px-3 pb-3">
                    {it.owned || it.role ? (
                        <p className="pt-1.5 text-[11px] font-semibold text-emerald-300/80">{it.owned && it.price > 0 && !staff ? <span className="inline-flex items-center gap-1"><Check size={12} strokeWidth={3} /> Yours</span> : ''}</p>
                    ) : lockedByLevel ? (
                        <p className="flex items-center justify-center gap-1.5 pt-1.5 text-[11px] font-semibold text-neutral-500"><CoinIcon className="h-3.5 w-3.5 opacity-50" /> {it.price.toLocaleString()}</p>
                    ) : (
                        <button
                            onClick={() => buy([{ slot: tab, it }])}
                            disabled={!afford || busy}
                            data-buy={it.key}
                            title={afford ? `Buy ${it.label} for ${it.price.toLocaleString()} SFD Coins` : `You need ${(it.price - coins).toLocaleString()} more SFD Coins`}
                            className={`${buyBtn} ${afford ? 'bg-linear-to-r from-amber-400 to-amber-500 text-amber-950 hover:from-amber-300 hover:to-amber-400' : 'cursor-not-allowed bg-white/5 text-neutral-500'}`}
                        >
                            <CoinIcon className="h-4 w-4" /> {it.price.toLocaleString()}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const none = (
        <button
            onClick={() => pick(tab, null)}
            aria-pressed={draft[tab] === null}
            className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-dashed p-3 pt-4 text-center transition hover:-translate-y-0.5 ${draft[tab] === null ? 'border-violet-400 bg-violet-500/10 ring-2 ring-violet-400' : 'border-white/15 bg-white/2 hover:border-white/30'}`}
        >
            <div className="mt-1 flex h-18 items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/20 text-neutral-500"><X size={18} /></span>
            </div>
            <div>
                <p className="text-sm font-semibold">None</p>
                <p className="text-[11px] text-neutral-500">Take it off</p>
            </div>
        </button>
    );

    const actions = (
        <>
            <button onClick={save} disabled={!changed.length || blocked.length > 0 || busy} className={`${primaryBtn} flex flex-1 items-center justify-center gap-2`}><Save size={15} /> {busy ? 'Working…' : 'Save look'}</button>
            <button onClick={reset} disabled={!changed.length} title="Undo my changes" aria-label="Undo my changes" className={ghostBtn}><RotateCcw size={15} /></button>
            <button onClick={surprise} title="Surprise me" aria-label="Surprise me" className={ghostBtn}><Shuffle size={15} /></button>
        </>
    );

    return (
        <AppLayout
            title="Avatar shop"
            subtitle="Buy avatars, badges, accessories, frames and effects with SFD Coins. Try anything on first, then save your look."
            actions={<Link href={route('profile.edit')} className={ghostBtn}>Upload a photo</Link>}
        >
            <Head title="Avatar shop" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[21rem_minmax(0,1fr)]">
                {/* the studio: what you are trying on, and what it looks like */}
                <div className="min-w-0">
                    <Card className="overflow-x-hidden lg:sticky lg:top-4 lg:max-h-[calc(100vh-5.5rem)]">
                        <div className="relative flex flex-col items-center bg-linear-to-b from-violet-600/25 via-fuchsia-600/10 to-transparent px-4 pb-3 pt-11">
                            <div className="pointer-events-none absolute left-1/2 top-5 h-40 w-40 -translate-x-1/2 rounded-full bg-violet-500/30 blur-3xl" />
                            <div key={pops} className="relative animate-pop">
                                <Avatar name={user.name} avatar={draft.avatar} cosmetics={worn} className="h-24 w-24 text-5xl" />
                            </div>
                            <div className="mt-3 h-2 w-20 rounded-[50%] bg-black/50 blur-md" />
                            <p className="mt-1.5 max-w-full truncate text-lg font-black tracking-tight">{user.name}</p>
                            <p className="text-xs text-neutral-400">{changed.length ? `${changed.length} ${changed.length === 1 ? 'change' : 'changes'} not saved yet` : 'This is your saved look'}</p>
                            {characterOf(draft.avatar) && (
                                <div className="relative mt-3 w-full">
                                    <div className="grid grid-cols-3 gap-2">
                                        {([['standing', 'Standing'], ['dancing', 'Dancing'], ['djing', 'DJing']] as const).map(([state, label]) => (
                                            <div key={state} className="flex flex-col items-center gap-1 rounded-xl bg-black/25 px-1 pb-1.5 pt-2">
                                                <img src={characterUrl(characterOf(draft.avatar)!, state)} alt="" draggable={false} className="h-20" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-center text-[11px] text-neutral-400">In the room you stand until you press Woot or Grab, then you dance. On the stage you are DJing.</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 px-4 pb-4">
                            <div className="space-y-2">
                                <div className="flex gap-2">{actions}</div>
                                {blocked.length > 0 && (
                                    <div className="space-y-2 rounded-xl border border-amber-400/25 bg-amber-400/6 p-3 text-xs" data-testid="not-yours">
                                        <p className="text-amber-200">Not yours yet: <span className="font-semibold">{blocked.map(({ it }) => it.label).join(', ')}</span>. Buy {blocked.length === 1 ? 'it' : 'them'} to save this look.</p>
                                        {buyable.length > 0 && (
                                            <button
                                                onClick={() => buy(buyable)}
                                                disabled={busy || coins < total}
                                                className={`${buyBtn} ${coins >= total ? 'bg-linear-to-r from-amber-400 to-amber-500 text-amber-950 hover:from-amber-300 hover:to-amber-400' : 'cursor-not-allowed bg-white/5 text-neutral-500'}`}
                                            >
                                                <CoinIcon className="h-4 w-4" /> Buy {buyable.length === 1 ? 'it' : `all ${buyable.length}`} for {total.toLocaleString()}
                                            </button>
                                        )}
                                        {coins < total && buyable.length > 0 && <p className="text-neutral-400">You need {(total - coins).toLocaleString()} more SFD Coins.</p>}
                                        {buyable.length < blocked.length && <p className="text-neutral-400">{blocked.filter(({ it }) => it.level > level).map(({ it }) => `${it.label} needs level ${it.level}`).join('; ')}.</p>}
                                    </div>
                                )}
                                {isPhoto(saved.avatar) && draft.avatar !== saved.avatar && <p className="text-xs text-neutral-400">A new avatar replaces your uploaded photo.</p>}
                                {message && <p className={`text-xs ${message.ok ? 'text-emerald-300' : 'text-red-300'}`} role="status">{message.text}</p>}
                            </div>
                            <div>
                                <div className="mb-1.5 flex items-baseline justify-between text-xs"><span className="font-bold text-white">Level {level}</span><span className="text-neutral-400">{toNextText(user.xp, level)}</span></div>
                                <ProgressBar value={levelPercent(user.xp, level)} />
                                {staff ? (
                                    <p className="mt-2 text-xs text-amber-300">You are SFD-DJ.EU staff: everything is yours, free.</p>
                                ) : nextLevel ? (
                                    <p className="mt-2 text-xs text-neutral-400">
                                        At level {nextLevel} you can buy {nextItems.length} more {nextItems.length === 1 ? 'thing' : 'things'}: {nextItems.slice(0, 3).map((it) => it.label).join(', ')}{nextItems.length > 3 ? '…' : ''}
                                    </p>
                                ) : (
                                    <p className="mt-2 text-xs text-emerald-300">Your level opens everything in the shop. Wear it well.</p>
                                )}
                            </div>

                            <ul className="space-y-0.5">
                                {slots.map(({ slot, one, icon: Icon }) => {
                                    const key = draft[slot];
                                    const icon = iconOf(slot, key);
                                    const dirty = key !== saved[slot];

                                    return (
                                        <li key={slot} className={`flex items-center gap-1 rounded-xl ${tab === slot ? 'bg-white/6' : ''}`}>
                                            <button onClick={() => setTab(slot)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1 text-left transition hover:bg-white/5">
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg text-neutral-400">{icon ?? <Icon size={15} />}</span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">{one}</span>
                                                    <span className="flex items-center gap-1.5 text-sm font-semibold"><span className="truncate">{labelOf(slot, key)}</span>{dirty && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" title="Not saved yet" />}</span>
                                                </span>
                                            </button>
                                            {key !== null && slot !== 'avatar' && (
                                                <button onClick={() => pick(slot, null)} title={`Take off the ${one.toLowerCase()}`} aria-label={`Take off the ${one.toLowerCase()}`} className="mr-1 rounded-lg p-1.5 text-neutral-500 hover:bg-white/10 hover:text-white"><X size={14} /></button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="rounded-xl bg-black/30 p-3 text-sm [@media(max-height:800px)]:hidden">
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">In chat</p>
                                <div className="space-y-3">
                                    <div className="flex gap-2.5">
                                        <Avatar name="DJ Kate" />
                                        <div className="min-w-0">
                                            <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400"><Badges level={7} /> DJ Kate</p>
                                            <p className="text-neutral-200">Great pick 🔥</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2.5">
                                        <Avatar name={user.name} avatar={draft.avatar} cosmetics={worn} />
                                        <div className="min-w-0">
                                            <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold" style={{ color: user.primary_role.color }}><Badges badges={chatBadges} level={level} /> {user.name}</p>
                                            <p className="text-neutral-200">New look, who dis? 😎</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </Card>
                </div>

                {/* the shelves */}
                <div className="min-w-0 space-y-5">
                    {/* the wallet: SFD Coins, the daily reward and how to earn more */}
                    <div className="overflow-hidden rounded-2xl border border-amber-400/25 bg-linear-to-r from-amber-500/12 via-amber-500/5 to-transparent">
                        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <CoinIcon className="h-11 w-11 drop-shadow-[0_2px_6px_rgba(245,184,46,0.45)]" />
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300/80">Your SFD Coins</p>
                                <p className="text-3xl font-black tabular-nums leading-tight text-white" data-testid="coins">{coins.toLocaleString()}</p>
                            </div>
                            <button
                                onClick={claim}
                                disabled={!daily.claimable || busy}
                                data-daily
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${daily.claimable ? 'bg-linear-to-r from-amber-400 to-amber-500 text-amber-950 shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400' : 'cursor-default bg-white/5 text-neutral-400'}`}
                            >
                                <Gift size={16} /> {daily.claimable ? `Claim ${daily.amount} daily coins` : 'Daily reward taken'}
                            </button>
                            <button onClick={() => setWallet((v) => !v)} aria-expanded={wallet} className={`${ghostBtn} flex items-center gap-1.5`}>How to earn <ChevronDown size={14} className={`transition ${wallet ? 'rotate-180' : ''}`} /></button>
                        </div>
                        {wallet && (
                            <div className="grid gap-4 border-t border-white/10 bg-black/20 px-4 py-3 text-sm sm:grid-cols-2">
                                <div>
                                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">What earns coins</p>
                                    <ul className="space-y-1">
                                        {earn.slice(1).map(([what, pays]) => <li key={what} className="flex items-baseline justify-between gap-3"><span className="text-neutral-300">{what}</span><span className="shrink-0 font-semibold text-amber-200">{pays}</span></li>)}
                                    </ul>
                                </div>
                                <div>
                                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Latest</p>
                                    {history.length === 0 ? <p className="text-neutral-500">Nothing yet. Play a song, or take the daily reward.</p> : (
                                        <ul className="space-y-1">
                                            {history.map((l, i) => (
                                                <li key={i} className="flex items-baseline justify-between gap-3">
                                                    <span className="min-w-0 truncate text-neutral-300">{reasons[l.reason] ?? l.reason}{l.note ? <span className="text-neutral-500"> · {l.note}</span> : ''}</span>
                                                    <span className={`shrink-0 font-semibold tabular-nums ${l.amount < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{l.amount > 0 ? '+' : ''}{l.amount.toLocaleString()}<span className="ml-1.5 font-normal text-neutral-500">{l.at ? ago(l.at) : ''}</span></span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300"><Trophy size={18} /></span>
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs"><span className="font-bold">Your collection</span><span className="text-neutral-400">{have} of {all.length} yours</span></div>
                            <ProgressBar value={(have / Math.max(1, all.length)) * 100} />
                        </div>
                    </div>

                    <Tabs<Slot>
                        compact
                        active={tab}
                        onChange={setTab}
                        tabs={slots.map(({ slot, tab: label, icon }) => ({ key: slot, label, icon, count: `${catalog[slot].filter((it) => it.owned).length}/${catalog[slot].length}` }))}
                    />

                    <div className="flex flex-wrap items-center gap-1.5">
                        {filters.map(([value, label]) => (
                            <button key={value} onClick={() => setShow(value)} className={chip(show === value)}>{label}</button>
                        ))}
                        <span className="ml-auto hidden items-center gap-1.5 text-xs text-neutral-500 sm:flex">You have <CoinPill amount={coins} /></span>
                    </div>

                    {items.length === 0 ? (
                        <EmptyState icon="🏆" title="Nothing here" text={show === 'owned' ? 'You do not have anything on this shelf yet.' : show === 'sale' ? 'Nothing on this shelf is for sale at your level right now.' : 'Everything on this shelf is open to you.'} />
                    ) : (
                        (Object.keys(rarities) as Rarity[]).map((r) => {
                            const group = items.filter((it) => it.rarity === r);
                            const withNone = tab !== 'avatar' && r === 'common' && show !== 'locked' && show !== 'sale'; // a character is never taken off: everybody has one
                            if (!group.length && !withNone) return null;

                            return (
                                <section key={r}>
                                    <h3 className="mb-2 flex items-baseline gap-2 text-xs font-bold uppercase tracking-wider">
                                        <span className={rarities[r].text}>{rarities[r].label}</span>
                                        <span className="font-medium normal-case tracking-normal text-neutral-500">{rarities[r].levels}</span>
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                                        {withNone && none}
                                        {group.map(card)}
                                    </div>
                                </section>
                            );
                        })
                    )}

                    {changed.length > 0 && (
                        <div className="sticky bottom-3 z-20 flex items-center gap-2 rounded-2xl border border-violet-400/30 bg-neutral-900/95 p-2.5 shadow-xl shadow-black/40 backdrop-blur lg:hidden">
                            <Avatar name={user.name} avatar={draft.avatar} cosmetics={worn} className="h-9 w-9 text-xl" />
                            <p className="min-w-0 flex-1 text-sm">
                                <span className="block font-semibold">{changed.length} not saved</span>
                                {blocked.length > 0 && <span className="block truncate text-xs text-amber-300">Buy {blocked.map(({ it }) => it.label).join(', ')} first</span>}
                            </p>
                            <button onClick={reset} aria-label="Undo my changes" className={ghostBtn}><RotateCcw size={15} /></button>
                            {buyable.length > 0 && <button onClick={() => buy(buyable)} disabled={busy || coins < total} className={`${primaryBtn} flex items-center gap-1.5`}><CoinIcon className="h-4 w-4" /> {total.toLocaleString()}</button>}
                            <button onClick={save} disabled={blocked.length > 0 || busy} className={primaryBtn}>Save</button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
