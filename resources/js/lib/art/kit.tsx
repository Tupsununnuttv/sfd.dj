import { CSSProperties } from 'react';

/**
 * The small pieces the Avatar shop's pictures are drawn from (badges, accessories, frames and effects: lib/cosmetics.tsx).
 * A picture asks for its ids with `u('name')`: they are the same all through one picture and different from every other picture on the page.
 */
export type Ids = (name: string) => string;

export const ref = (u: Ids, name: string) => `url(#${u(name)})`;

/** Round to one decimal, so the markup stays short. */
export const r1 = (n: number) => Math.round(n * 10) / 10;

type Stop = readonly [number, string] | readonly [number, string, number];

/** A linear gradient: stops are [where, colour] or [where, colour, opacity]; `v` is its start and end as x1 y1 x2 y2 (0 to 1). */
export const lin = (id: string, stops: readonly Stop[], v: readonly [number, number, number, number] = [0, 0, 0, 1]) => (
    <linearGradient id={id} x1={v[0]} y1={v[1]} x2={v[2]} y2={v[3]}>
        {stops.map(([o, c, a], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />)}
    </linearGradient>
);

/** A round gradient: `c` is its middle and its radius as cx cy r (0 to 1). */
export const rad = (id: string, stops: readonly Stop[], c: readonly [number, number, number] = [0.5, 0.5, 0.5]) => (
    <radialGradient id={id} cx={c[0]} cy={c[1]} r={c[2]}>
        {stops.map(([o, col, a], i) => <stop key={i} offset={o} stopColor={col} stopOpacity={a ?? 1} />)}
    </radialGradient>
);

/** The point at angle `a` (degrees, clockwise from the right) and distance `r` from the middle of the avatar (50, 50). */
export const pt = (a: number, r: number): [number, number] => [r1(50 + Math.cos((a * Math.PI) / 180) * r), r1(50 + Math.sin((a * Math.PI) / 180) * r)];

/** An arc of the circle of radius `r` round the avatar, from angle `a0` to `a1` (clockwise). */
export const arc = (a0: number, a1: number, r: number) => {
    const [x0, y0] = pt(a0, r);
    const [x1, y1] = pt(a1, r);

    return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};

/** A four-pointed sparkle, `s` times 8 units from its middle to a tip. */
export const sparkle = (s = 1) => `M0 ${-8 * s}L${r1(1.9 * s)} ${r1(-1.9 * s)}L${8 * s} 0L${r1(1.9 * s)} ${r1(1.9 * s)}L0 ${8 * s}L${r1(-1.9 * s)} ${r1(1.9 * s)}L${-8 * s} 0L${r1(-1.9 * s)} ${r1(-1.9 * s)}Z`;

/** A star with `n` points, tips `ro` and valleys `ri` from the middle, one tip straight up. */
export const star = (n: number, ro: number, ri: number) =>
    `M${Array.from({ length: n * 2 }, (_, i) => { const a = (i * Math.PI) / n - Math.PI / 2; const r = i % 2 ? ri : ro; return `${r1(Math.cos(a) * r)} ${r1(Math.sin(a) * r)}`; }).join('L')}Z`;

/** Start an animation part-way into its loop (a negative delay), so a row of things does not move in step. */
export const after = (s: number): CSSProperties => ({ animationDelay: `${s}s` });
