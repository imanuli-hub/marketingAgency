import { DOUBLE_ZERO, RED_NUMBERS, type Pocket, type WheelType, pocketLabel } from "./wheel";

export type BetKind =
  | "straight"
  | "split"
  | "street"
  | "trio"
  | "corner"
  | "firstFour"
  | "basket"
  | "sixLine"
  | "dozen"
  | "column"
  | "red"
  | "black"
  | "odd"
  | "even"
  | "low"
  | "high";

/** A bet location on the layout, independent of the amount staked. */
export interface BetSpec {
  /** Canonical key, e.g. "split:1-2". Chips on the same key stack. */
  key: string;
  kind: BetKind;
  /** Pockets that win this bet. */
  numbers: Pocket[];
  /** Net payout odds "X to 1". */
  payout: number;
  label: string;
}

export interface PlacedBet extends BetSpec {
  amount: number;
}

export const PAYOUTS: Record<BetKind, number> = {
  straight: 35,
  split: 17,
  street: 11,
  trio: 11,
  corner: 8,
  firstFour: 8,
  basket: 6,
  sixLine: 5,
  dozen: 2,
  column: 2,
  red: 1,
  black: 1,
  odd: 1,
  even: 1,
  low: 1,
  high: 1,
};

export const EVEN_MONEY_KINDS: ReadonlySet<BetKind> = new Set([
  "red", "black", "odd", "even", "low", "high",
]);

export const INSIDE_KINDS: ReadonlySet<BetKind> = new Set([
  "straight", "split", "street", "trio", "corner", "firstFour", "basket", "sixLine",
]);

export function isEvenMoney(kind: BetKind): boolean {
  return EVEN_MONEY_KINDS.has(kind);
}

export class InvalidBetError extends Error {}

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const sortPockets = (ns: Pocket[]) =>
  [...ns].sort((a, b) => {
    // 0 and 00 first, then ascending
    const rank = (p: number) => (p === 0 ? -2 : p === DOUBLE_ZERO ? -1 : p);
    return rank(a) - rank(b);
  });

function spec(kind: BetKind, numbers: Pocket[], label: string): BetSpec {
  const sorted = sortPockets(numbers);
  return {
    key: `${kind}:${sorted.map(pocketLabel).join("-")}`,
    kind,
    numbers: sorted,
    payout: PAYOUTS[kind],
    label,
  };
}

function assertNumber(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 36) throw new InvalidBetError(`Invalid number ${n}`);
}

/** Column index 0..2 for a number 1..36 (column 1 = 1,4,7…). */
export const columnOf = (n: number) => (n - 1) % 3;

export function straight(n: Pocket, wheel: WheelType = "european"): BetSpec {
  const ok = (n >= 0 && n <= 36 && Number.isInteger(n)) || (n === DOUBLE_ZERO && wheel === "american");
  if (!ok) throw new InvalidBetError(`Invalid straight-up number ${n}`);
  return spec("straight", [n], `Straight ${pocketLabel(n)}`);
}

const ZERO_SPLITS: Record<WheelType, [Pocket, Pocket][]> = {
  european: [[0, 1], [0, 2], [0, 3]],
  american: [[0, 1], [0, 2], [DOUBLE_ZERO, 2], [DOUBLE_ZERO, 3], [0, DOUBLE_ZERO]],
};

export function split(a: Pocket, b: Pocket, wheel: WheelType = "european"): BetSpec {
  const [lo, hi] = sortPockets([a, b]);
  const zeroOk = ZERO_SPLITS[wheel].some(([x, y]) => sortPockets([x, y]).join() === [lo, hi].join());
  if (!zeroOk) {
    assertNumber(lo);
    assertNumber(hi);
    const horizontal = hi - lo === 3; // neighbours along the length of the table
    const vertical = hi - lo === 1 && columnOf(lo) !== 2; // same street
    if (!horizontal && !vertical) throw new InvalidBetError(`${a} and ${b} are not adjacent`);
  }
  return spec("split", [lo, hi], `Split ${pocketLabel(lo)}/${pocketLabel(hi)}`);
}

/** Street starting at n (n = 1, 4, 7 … 34). */
export function street(n: number): BetSpec {
  if (!Number.isInteger(n) || n < 1 || n > 34 || n % 3 !== 1) throw new InvalidBetError(`Invalid street ${n}`);
  return spec("street", [n, n + 1, n + 2], `Street ${n}–${n + 2}`);
}

const TRIOS: Record<WheelType, Pocket[][]> = {
  european: [[0, 1, 2], [0, 2, 3]],
  american: [[0, 1, 2], [DOUBLE_ZERO, 2, 3]],
};

export function trio(numbers: Pocket[], wheel: WheelType = "european"): BetSpec {
  const key = sortPockets(numbers).join();
  if (!TRIOS[wheel].some((t) => sortPockets(t).join() === key)) {
    throw new InvalidBetError(`Invalid trio ${numbers.join("-")}`);
  }
  return spec("trio", numbers, `Trio ${sortPockets(numbers).map(pocketLabel).join("-")}`);
}

/** Corner whose lowest number is n (n not in the top row, n <= 32). */
export function corner(n: number): BetSpec {
  if (!Number.isInteger(n) || n < 1 || n > 32 || columnOf(n) === 2) throw new InvalidBetError(`Invalid corner ${n}`);
  return spec("corner", [n, n + 1, n + 3, n + 4], `Corner ${n}/${n + 1}/${n + 3}/${n + 4}`);
}

export function firstFour(wheel: WheelType = "european"): BetSpec {
  if (wheel !== "european") throw new InvalidBetError("First four is a European-layout bet");
  return spec("firstFour", [0, 1, 2, 3], "First Four 0-1-2-3");
}

export function basket(wheel: WheelType = "american"): BetSpec {
  if (wheel !== "american") throw new InvalidBetError("Basket (top line) is an American-layout bet");
  return spec("basket", [0, DOUBLE_ZERO, 1, 2, 3], "Basket 0-00-1-2-3");
}

/** Six line starting at n (n = 1, 4 … 31). */
export function sixLine(n: number): BetSpec {
  if (!Number.isInteger(n) || n < 1 || n > 31 || n % 3 !== 1) throw new InvalidBetError(`Invalid six line ${n}`);
  return spec("sixLine", range(n, n + 5), `Six Line ${n}–${n + 5}`);
}

/** Dozen 1, 2 or 3. */
export function dozen(d: 1 | 2 | 3): BetSpec {
  if (![1, 2, 3].includes(d)) throw new InvalidBetError(`Invalid dozen ${d}`);
  const start = (d - 1) * 12 + 1;
  return spec("dozen", range(start, start + 11), `${["1st", "2nd", "3rd"][d - 1]} 12`);
}

/** Column 1, 2 or 3 (column 1 = 1,4,7…34; column 3 = 3,6…36). */
export function column(c: 1 | 2 | 3): BetSpec {
  if (![1, 2, 3].includes(c)) throw new InvalidBetError(`Invalid column ${c}`);
  return spec("column", range(1, 36).filter((n) => columnOf(n) === c - 1), `Column ${c}`);
}

export const red = () => spec("red", range(1, 36).filter((n) => RED_NUMBERS.has(n)), "Red");
export const black = () => spec("black", range(1, 36).filter((n) => !RED_NUMBERS.has(n)), "Black");
export const odd = () => spec("odd", range(1, 36).filter((n) => n % 2 === 1), "Odd");
export const even = () => spec("even", range(1, 36).filter((n) => n % 2 === 0), "Even");
export const low = () => spec("low", range(1, 18), "1–18 (Low)");
export const high = () => spec("high", range(19, 36), "19–36 (High)");

export function place(s: BetSpec, amount: number): PlacedBet {
  return { ...s, amount };
}

/** Every distinct bet location available on a given wheel (used by tests and the coach). */
export function allBetSpecs(wheel: WheelType): BetSpec[] {
  const out: BetSpec[] = [];
  const pockets = range(0, 36).concat(wheel === "american" ? [DOUBLE_ZERO] : []);
  pockets.forEach((p) => out.push(straight(p, wheel)));
  ZERO_SPLITS[wheel].forEach(([a, b]) => out.push(split(a, b, wheel)));
  for (let n = 1; n <= 36; n++) {
    if (n + 3 <= 36) out.push(split(n, n + 3));
    if (columnOf(n) !== 2) out.push(split(n, n + 1));
  }
  for (let n = 1; n <= 34; n += 3) out.push(street(n));
  TRIOS[wheel].forEach((t) => out.push(trio(t, wheel)));
  for (let n = 1; n <= 32; n++) if (columnOf(n) !== 2) out.push(corner(n));
  out.push(wheel === "european" ? firstFour() : basket());
  for (let n = 1; n <= 31; n += 3) out.push(sixLine(n));
  ([1, 2, 3] as const).forEach((d) => out.push(dozen(d), column(d)));
  out.push(red(), black(), odd(), even(), low(), high());
  return out;
}
