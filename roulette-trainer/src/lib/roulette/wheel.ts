/**
 * Wheel definitions. Pockets are integers: 0–36 are themselves and
 * 37 represents the American "00" pocket.
 */
export type WheelType = "european" | "american";
export type Pocket = number;
export type PocketColor = "red" | "black" | "green";

export const DOUBLE_ZERO: Pocket = 37;

export const EUROPEAN_ORDER: readonly Pocket[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const AMERICAN_ORDER: readonly Pocket[] = [
  0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, DOUBLE_ZERO,
  27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2,
];

export const RED_NUMBERS: ReadonlySet<number> = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export function wheelOrder(type: WheelType): readonly Pocket[] {
  return type === "european" ? EUROPEAN_ORDER : AMERICAN_ORDER;
}

/** Number of pockets on the wheel (37 or 38). */
export function pocketCount(type: WheelType): number {
  return type === "european" ? 37 : 38;
}

/** All pockets in ascending order (0, 1..36, and 00 for American). */
export function allPockets(type: WheelType): Pocket[] {
  const p = Array.from({ length: 37 }, (_, i) => i);
  if (type === "american") p.push(DOUBLE_ZERO);
  return p;
}

export function isZero(p: Pocket): boolean {
  return p === 0 || p === DOUBLE_ZERO;
}

export function pocketColor(p: Pocket): PocketColor {
  if (isZero(p)) return "green";
  return RED_NUMBERS.has(p) ? "red" : "black";
}

export function pocketLabel(p: Pocket): string {
  return p === DOUBLE_ZERO ? "00" : String(p);
}

export function isValidPocket(p: Pocket, type: WheelType): boolean {
  if (!Number.isInteger(p)) return false;
  if (p >= 0 && p <= 36) return true;
  return type === "american" && p === DOUBLE_ZERO;
}
