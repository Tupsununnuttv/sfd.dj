// Drawing helpers for the rounder characters (the panda, the dragons, the milk carton): smooth outlines through points, soft limbs and fur.

export const r1 = (n) => Math.round(n * 10) / 10;

/** A closed smooth outline through the points (Catmull-Rom turned into cubic curves). `tension` 1 is the usual round, less is tighter. */
export function smooth(points, tension = 1) {
    const n = points.length;
    const at = (i) => points[(i + n) % n];
    let d = `M${r1(points[0][0])} ${r1(points[0][1])}`;
    for (let i = 0; i < n; i++) {
        const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
        const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
        const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
        d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
    }
    return d + 'Z';
}

/** An open smooth line through the points. */
export function line(points, tension = 1) {
    const n = points.length;
    const at = (i) => points[Math.max(0, Math.min(n - 1, i))];
    let d = `M${r1(points[0][0])} ${r1(points[0][1])}`;
    for (let i = 0; i < n - 1; i++) {
        const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
        const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
        const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
        d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
    }
    return d;
}

/**
 * An oval round (cx, cy) whose edge has bumps: `bumps` is a list of [angle in degrees (0 = right, 90 = down), how far out (share of the radius), how wide (degrees)].
 * Fur tufts on a cheek, the scallops of a cloud. `steps` points round.
 */
export function blob(cx, cy, rx, ry, bumps = [], steps = 72) {
    const points = Array.from({ length: steps }, (_, i) => {
        const a = (i / steps) * 360;
        const out = bumps.reduce((sum, [at, size, width]) => {
            const diff = Math.abs(((a - at + 540) % 360) - 180);
            return sum + (diff < width ? size * (Math.cos((diff / width) * Math.PI) + 1) / 2 : 0);
        }, 0);
        const rad = (a * Math.PI) / 180;
        return [cx + Math.cos(rad) * rx * (1 + out), cy + Math.sin(rad) * ry * (1 + out)];
    });
    return smooth(points);
}

/** A soft limb from (x1, y1) to (x2, y2), `ra` thick at the start and `rb` at the end (radii), round at both ends. */
export function capsule([x1, y1], [x2, y2], ra, rb = ra) {
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, nx = -uy, ny = ux;
    const P = (x, y) => `${r1(x)} ${r1(y)}`;
    return `M${P(x1 + nx * ra, y1 + ny * ra)}L${P(x2 + nx * rb, y2 + ny * rb)}A${r1(rb)} ${r1(rb)} 0 0 0 ${P(x2 - nx * rb, y2 - ny * rb)}L${P(x1 - nx * ra, y1 - ny * ra)}A${r1(ra)} ${r1(ra)} 0 0 0 ${P(x1 + nx * ra, y1 + ny * ra)}Z`;
}

/** Short fur strokes along a curve: `n` little lines leaning out from the points of an open path given as points. */
export function furStrokes(points, length = 4, lean = 0.6) {
    return points.map(([x, y], i) => {
        const [px, py] = points[Math.max(0, i - 1)], [qx, qy] = points[Math.min(points.length - 1, i + 1)];
        const tx = qx - px, ty = qy - py, l = Math.hypot(tx, ty) || 1;
        const nx = -ty / l, ny = tx / l;
        return `M${r1(x)} ${r1(y)}L${r1(x + nx * length + (tx / l) * length * lean)} ${r1(y + ny * length + (ty / l) * length * lean)}`;
    }).join('');
}
