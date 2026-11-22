/**
 * Geometry of the betting layout.
 *
 * Model space (horizontal orientation, units = one number cell):
 *   x ∈ [-1, 0]   zero column (0, and 00 on American tables)
 *   x ∈ [0, 12]   12 streets of three numbers; y ∈ [0, 3] rows (top row = 3, 6 … 36)
 *   x ∈ [12, 13]  "2 to 1" column bets
 *   y ∈ [3, 4]    dozens
 *   y ∈ [4, 5]    even-money bets
 *
 * The vertical (phone) layout is a rotation: (x, y) → (3 − y, x).
 */
import * as B from "./bets";
import type { BetSpec } from "./bets";
import { DOUBLE_ZERO, type WheelType } from "./wheel";

export type Orientation = "horizontal" | "vertical";
export interface Pt { x: number; y: number }
export interface Rect { x0: number; y0: number; x1: number; y1: number }

/** Number at street column c (0..11) and row r (0 = top). */
export const numberAt = (c: number, r: number) => 3 * c + (3 - r);
export const colOf = (n: number) => Math.ceil(n / 3) - 1;
export const rowOf = (n: number) => 2 - ((n - 1) % 3);

export const EVEN_MONEY_ORDER = ["low", "even", "red", "black", "odd", "high"] as const;
const evenMoneySpec = (k: (typeof EVEN_MONEY_ORDER)[number]) => B[k]();

/** Where the chip for a bet sits (model space, horizontal). */
export function anchorFor(spec: BetSpec, wheel: WheelType): Pt {
  const ns = spec.numbers;
  const has00 = ns.includes(DOUBLE_ZERO);
  switch (spec.kind) {
    case "straight": {
      const n = ns[0];
      if (n === 0) return { x: -0.5, y: wheel === "american" ? 2.25 : 1.5 };
      if (n === DOUBLE_ZERO) return { x: -0.5, y: 0.75 };
      return { x: colOf(n) + 0.5, y: rowOf(n) + 0.5 };
    }
    case "split": {
      const [a, b] = ns;
      if (a === 0 && b === DOUBLE_ZERO) return { x: -0.5, y: 1.5 };
      if (a === 0 || a === DOUBLE_ZERO) {
        if (wheel === "american" && b === 2) return { x: 0, y: a === 0 ? 1.75 : 1.25 };
        return { x: 0, y: rowOf(b) + 0.5 };
      }
      if (b - a === 3) return { x: colOf(a) + 1, y: rowOf(a) + 0.5 };
      return { x: colOf(a) + 0.5, y: rowOf(a) };
    }
    case "street": return { x: colOf(ns[0]) + 0.5, y: 3 };
    case "sixLine": return { x: colOf(ns[0]) + 1, y: 3 };
    case "corner": return { x: colOf(ns[0]) + 1, y: rowOf(ns[0]) };
    case "trio": return { x: 0, y: ns.includes(1) ? 2 : has00 || ns.includes(3) ? 1 : 1.5 };
    case "firstFour":
    case "basket": return { x: 0, y: 3 };
    case "dozen": return { x: 4 * (Math.ceil(ns[0] / 12) - 1) + 2, y: 3.5 };
    case "column": return { x: 12.5, y: rowOf(ns[0]) + 0.5 };
    default: {
      const i = EVEN_MONEY_ORDER.indexOf(spec.kind as (typeof EVEN_MONEY_ORDER)[number]);
      return { x: 2 * i + 1, y: 4.5 };
    }
  }
}

/**
 * Resolve a point (model space) to a bet. `tx`/`ty` are the snap distances
 * (in cell units) for edges and corners along each axis.
 */
export function hitTest(p: Pt, wheel: WheelType, tx = 0.22, ty = 0.22): BetSpec | null {
  const { x, y } = p;
  const eps = 1e-9;
  // Zero area
  if (x >= -1 - eps && x < -Math.min(tx, 0.3) && y >= 0 && y <= 3) {
    if (wheel === "european") return B.straight(0);
    if (Math.abs(y - 1.5) < ty) return B.split(0, DOUBLE_ZERO, wheel);
    return B.straight(y < 1.5 ? DOUBLE_ZERO : 0, wheel);
  }
  // Number grid (including its edges)
  if (x >= -Math.min(tx, 0.3) - eps && x <= 12 + eps && y >= -eps && y <= 3 + Math.min(ty, 0.3)) {
    const c = Math.min(11, Math.max(0, Math.floor(x)));
    const r = Math.min(2, Math.max(0, Math.floor(y)));
    const fx = x - c;
    const fy = y - r;
    let cb: number | null = null; // column boundary index 0..12
    if (fx < tx) cb = c;
    else if (fx > 1 - tx) cb = c + 1;
    if (cb === 12) cb = null; // right edge: belongs to the number
    let rb: number | null = null; // row boundary 0..3
    if (fy < ty) rb = r;
    else if (fy > 1 - ty) rb = r + 1;
    if (rb === 0) rb = null; // top edge
    if (y > 3) rb = 3;

    if (cb === 0) {
      // Boundary with the zero column
      if (wheel === "european") {
        if (rb === 3) return B.firstFour();
        if (rb === 1) return B.trio([0, 2, 3]);
        if (rb === 2) return B.trio([0, 1, 2]);
        return B.split(0, numberAt(0, r));
      }
      if (rb === 3) return B.basket();
      if (rb === 1) return B.trio([DOUBLE_ZERO, 2, 3], wheel);
      if (rb === 2) return B.trio([0, 1, 2], wheel);
      if (r === 0) return B.split(DOUBLE_ZERO, 3, wheel);
      if (r === 2) return B.split(0, 1, wheel);
      return B.split(fy < 0.5 ? DOUBLE_ZERO : 0, 2, wheel);
    }
    if (cb === null && rb === null) return B.straight(numberAt(c, r), wheel);
    if (cb === null) {
      if (rb === 3) return B.street(3 * c + 1);
      return B.split(numberAt(c, rb!), numberAt(c, rb! - 1));
    }
    if (rb === null) return B.split(numberAt(cb - 1, r), numberAt(cb, r));
    if (rb === 3) return B.sixLine(3 * (cb - 1) + 1);
    return B.corner(numberAt(cb - 1, rb));
  }
  // Column bets
  if (x > 12 && x <= 13 && y >= 0 && y < 3) {
    const r = Math.min(2, Math.floor(y));
    return B.column((3 - r) as 1 | 2 | 3);
  }
  // Dozens
  if (x >= 0 && x <= 12 && y > 3 && y <= 4) return B.dozen((Math.min(2, Math.floor(x / 4)) + 1) as 1 | 2 | 3);
  // Even money
  if (x >= 0 && x <= 12 && y > 4 && y <= 5) return evenMoneySpec(EVEN_MONEY_ORDER[Math.min(5, Math.floor(x / 2))]);
  return null;
}

/** Rotate a horizontal model point into the requested orientation. */
export function orient(p: Pt, o: Orientation): Pt {
  return o === "horizontal" ? p : { x: 3 - p.y, y: p.x };
}
/** Inverse of `orient`. */
export function unorient(p: Pt, o: Orientation): Pt {
  return o === "horizontal" ? p : { x: p.y, y: 3 - p.x };
}
export function orientRect(r: Rect, o: Orientation): Rect {
  if (o === "horizontal") return r;
  return { x0: 3 - r.y1, x1: 3 - r.y0, y0: r.x0, y1: r.x1 };
}
export const LAYOUT_BOUNDS: Record<Orientation, Rect> = {
  horizontal: { x0: -1, y0: 0, x1: 13, y1: 5 },
  vertical: { x0: -2, y0: -1, x1: 3, y1: 13 },
};

export interface Cell {
  rect: Rect; // horizontal model space
  spec: BetSpec;
  label: string;
  fill: "red" | "black" | "green" | "felt";
}

/** Rectangular cells to draw (numbers, zeros and outside bets). */
export function layoutCells(wheel: WheelType): Cell[] {
  const cells: Cell[] = [];
  if (wheel === "european") cells.push({ rect: { x0: -1, y0: 0, x1: 0, y1: 3 }, spec: B.straight(0), label: "0", fill: "green" });
  else {
    cells.push({ rect: { x0: -1, y0: 0, x1: 0, y1: 1.5 }, spec: B.straight(DOUBLE_ZERO, wheel), label: "00", fill: "green" });
    cells.push({ rect: { x0: -1, y0: 1.5, x1: 0, y1: 3 }, spec: B.straight(0, wheel), label: "0", fill: "green" });
  }
  for (let n = 1; n <= 36; n++) {
    const c = colOf(n), r = rowOf(n);
    cells.push({ rect: { x0: c, y0: r, x1: c + 1, y1: r + 1 }, spec: B.straight(n, wheel), label: String(n), fill: B.red().numbers.includes(n) ? "red" : "black" });
  }
  ([3, 2, 1] as const).forEach((col, r) =>
    cells.push({ rect: { x0: 12, y0: r, x1: 13, y1: r + 1 }, spec: B.column(col), label: "2 to 1", fill: "felt" }));
  ([1, 2, 3] as const).forEach((d) =>
    cells.push({ rect: { x0: 4 * (d - 1), y0: 3, x1: 4 * d, y1: 4 }, spec: B.dozen(d), label: ["1st 12", "2nd 12", "3rd 12"][d - 1], fill: "felt" }));
  const labels = { low: "1–18", even: "EVEN", red: "RED", black: "BLACK", odd: "ODD", high: "19–36" };
  EVEN_MONEY_ORDER.forEach((k, i) =>
    cells.push({ rect: { x0: 2 * i, y0: 4, x1: 2 * i + 2, y1: 5 }, spec: evenMoneySpec(k), label: labels[k], fill: "felt" }));
  return cells;
}
