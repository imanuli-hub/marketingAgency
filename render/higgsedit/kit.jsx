// Shared helpers for code-drawn cartoon scenes (episodes/<slug>.jsx).
import { circle, ellipse, INK } from "./mascot.jsx";
import { CYAN, W, H } from "./brand.jsx";

export { circle, ellipse, INK, CYAN, W, H };
export const YELLOW = "#FFD84D";
export const PINK = "#F6A5B5";
export const RED = "#FF6B6B";

/** A full-canvas path (scene pixel coordinates). */
export const P = (d, props = {}) => <path d={d} x={0} y={0} width={W} height={H} {...props} />;
/** A full-canvas layer frame. */
export const full = (children, animate) => (
  <frame x={0} y={0} width={W} height={H} layout="none" animate={animate}>{children}</frame>
);

/**
 * Keyframes made safe for Higgsedit: times clamped inside the node's
 * duration and strictly increasing.
 */
export function keys(dur, list) {
  const out = [];
  let last = -1;
  for (const k of list) {
    let at = Math.min(Math.max(0, k.at), dur - 0.02);
    if (at <= last) at = last + 0.01;
    if (at > dur - 0.01) break;
    out.push({ ...k, at: Math.round(at * 1000) / 1000 });
    last = at;
  }
  if (out.length < 2) out.push({ ...out[0], at: Math.min(dur - 0.01, (out[0]?.at ?? 0) + 0.01) });
  return out;
}

/** Opacity: hidden until `at`, then visible (fades in over 0.15 s). */
export const show = (at, dur) => [{ property: "opacity", keyframes: keys(dur, [{ at: 0, value: 0, easing: "hold" }, { at, value: 0 }, { at: at + 0.15, value: 1 }, { at: dur, value: 1 }]) }];
/** Opacity: visible until `at`, then hidden. */
export const hideAt = (at, dur) => [{ property: "opacity", keyframes: keys(dur, [{ at: 0, value: 1, easing: "hold" }, { at, value: 1 }, { at: at + 0.12, value: 0 }, { at: dur, value: 0 }]) }];

export const bob = (dur, amp = 10) => {
  const n = Math.max(2, Math.floor(dur / 0.9));
  const step = dur / n;
  return [{ property: "offsetY", keyframes: [{ at: 0, value: 0 }, { at: step / 2, value: -amp }, { at: step, value: 0 }], repeat: n, easing: "ease-in-out" }];
};
export const wiggle = (dur, deg = 4, period = 0.24) => {
  const n = Math.max(2, Math.floor((dur - 0.05) / period));
  return [{ property: "rotation", keyframes: [{ at: 0, value: -deg }, { at: period / 2, value: deg }, { at: period, value: -deg }], repeat: n }];
};
export const pulse = (dur, lo = 0.94, hi = 1.06, period = 1.2) => {
  const n = Math.max(2, Math.floor((dur - 0.05) / period));
  return [{ property: "scale", keyframes: [{ at: 0, value: lo }, { at: period / 2, value: hi }, { at: period, value: lo }], repeat: n, easing: "ease-in-out" }];
};

export const big = (text, y, color = "#FFFFFF", size = 64, animate) => (
  <text x={60} y={y} width={960} align="center" fontFamily="Montserrat" fontWeight={800} fontSize={size} color={color}
    shadow={{ x: 0, y: 3, blur: 10, color: "#000000AA" }} animate={animate}>{text}</text>
);

/** Where a <Mascot x y scale> draws its head (centre and radius) in scene pixels. */
export const headPos = (x, y, s = 1) => ({ cx: x + 300, cy: y + 470 - 210 * s, r: 200 * s });

/** Sine wave polyline from x0 to x1 around baseline y. invert flips it (anti-phase). */
export function wavePath(x0, x1, y, amp, wavelength, invert = false, phase = 0) {
  const pts = [];
  const n = 90;
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const v = Math.sin(((x - x0) / wavelength) * 2 * Math.PI + phase) * amp * (invert ? -1 : 1);
    pts.push(`${i ? "L" : "M"}${x.toFixed(1)},${(y + v).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** Arc polyline (degrees, 0 = right, counter-clockwise up). */
export function arcPath(cx, cy, r, a0, a1) {
  const pts = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    pts.push(`${i ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(1)},${(cy - r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** Semicircular gauge whose needle swings from `fromDeg` to `toDeg` at `at` (0 = straight up, + = right). */
export function Gauge({ cx, cy, r = 260, label, fromDeg = 55, toDeg = -60, at, dur, lowColor = CYAN, highColor = RED }) {
  return [
    P(arcPath(cx, cy, r, 180, 0), { stroke: { width: 28, color: "#FFFFFF", cap: "round" } }),
    P(arcPath(cx, cy, r, 180, 135), { stroke: { width: 28, color: lowColor, cap: "round" } }),
    P(arcPath(cx, cy, r, 45, 0), { stroke: { width: 28, color: highColor, cap: "round" } }),
    label ? <text x={cx - 300} y={cy + 30} width={600} align="center" fontFamily="Montserrat" fontWeight={800} fontSize={50} color="#FFFFFF">{label}</text> : null,
    <frame x={cx - 300} y={cy - 300} width={600} height={600} origin="center" layout="none"
      animate={[{ property: "rotation", keyframes: keys(dur, [{ at: 0, value: fromDeg }, { at, value: fromDeg }, { at: at + 0.5, value: toDeg, easing: "bounce" }, { at: dur, value: toDeg }]) }]}>
      <rect x={292} y={300 - r + 40} width={16} height={r - 40} radius={8} fill={INK} strokeColor="#FFFFFF" strokeWidth={4} />
      <path d={circle(300, 300, 26)} x={0} y={0} width={600} height={600} fill="#FFFFFF" stroke={{ width: 8, color: INK }} />
    </frame>,
  ];
}

/** Text values shown one after another, evenly over [t0, t1]; the last stays. */
export function Steps({ values, y, t0 = 0, t1, dur, color = CYAN, size = 110 }) {
  const seg = (t1 - t0) / values.length;
  return values.map((v, i) => {
    const on = t0 + i * seg;
    const last = i === values.length - 1;
    const ks = i === 0
      ? [{ at: 0, value: 1, easing: "hold" }, { at: on + seg, value: last ? 1 : 0, easing: "hold" }, { at: dur, value: last ? 1 : 0 }]
      : [{ at: 0, value: 0, easing: "hold" }, { at: on, value: 1, easing: "hold" }, { at: on + seg, value: last ? 1 : 0, easing: "hold" }, { at: dur, value: last ? 1 : 0 }];
    return (
      <text key={`s${i}`} x={60} y={y} width={960} align="center" fontFamily="Montserrat" fontWeight={800} fontSize={size} color={color}
        animate={[{ property: "opacity", keyframes: keys(dur, ks) }]}>{v}</text>
    );
  });
}

/** Zig-zag spark centred at (x, y). */
export const sparkPath = (x, y, s = 1) =>
  `M${x - 40 * s},${y - 60 * s} L${x + 5 * s},${y - 10 * s} L${x - 15 * s},${y} L${x + 40 * s},${y + 60 * s} L${x - 2 * s},${y + 8 * s} L${x + 18 * s},${y - 2 * s} Z`;

/** A few snowflakes drifting down. */
export function Snow({ dur, n = 9 }) {
  return Array.from({ length: n }, (_, i) => {
    const x = 80 + ((i * 113) % 920);
    const y = 220 + ((i * 197) % 700);
    return (
      <frame key={`f${i}`} x={x - 20} y={y - 20} width={40} height={40} layout="none"
        animate={[{ property: "offsetY", from: -40, to: 120, at: 0, duration: dur - 0.02, easing: "linear" }]}>
        <path d="M20,2 L20,38 M2,20 L38,20 M7,7 L33,33 M33,7 L7,33" x={0} y={0} width={40} height={40} stroke={{ width: 4, color: "#DDF3FF", cap: "round" }} />
      </frame>
    );
  });
}

/** Little goosebump dots over an area. */
export const bumps = (x, y, w, h, n = 14) =>
  Array.from({ length: n }, (_, i) => P(circle(x + ((i * 37) % w), y + ((i * 53) % h), 7), { fill: "#E3E7EE", stroke: { width: 4, color: INK } }));

/** Plus / minus charge sign. */
export const charge = (x, y, plus = true, color = YELLOW) =>
  P(plus ? `M${x - 16},${y} L${x + 16},${y} M${x},${y - 16} L${x},${y + 16}` : `M${x - 16},${y} L${x + 16},${y}`, { stroke: { width: 9, color, cap: "round" } });
