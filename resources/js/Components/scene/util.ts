import { floorRowY } from '@/lib/scenes';
import { CSSProperties } from 'react';

/** Small helpers the drawn sceneries share. */

/** A repeatable stream of numbers between 0 and 1 from a seed, so stars, snow and leaves are in the same places every time. */
export const rand = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/** Round to one decimal, so the markup stays short. */
export const r1 = (n: number) => Math.round(n * 10) / 10;

/** Start an animation part-way into its loop (a negative delay), so a row of lights does not blink in step. */
export const after = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

/** The tiles of the floor in perspective, as column and row, for as long as the floor goes on (`height` is how tall the canvas is). */
export const floorGrid = (height: number) => Array.from({ length: 12 }, (_, j) => Array.from({ length: 16 }, (_, k) => k - 8).map((i) => ({ i, j }))).flat().filter(({ j }) => floorRowY(j + 1) < height + 120);
