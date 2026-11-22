import { describe, expect, it } from "vitest";
import { spinPocket } from "../engine";
import { cryptoRng, seededRng } from "../rng";
import { DOUBLE_ZERO } from "../wheel";

function chiSquare(counts: number[], expected: number) {
  return counts.reduce((s, c) => s + (c - expected) ** 2 / expected, 0);
}

describe("random number generation", () => {
  it("seeded RNG is reproducible", () => {
    const a = seededRng(42), b = seededRng(42), c = seededRng(43);
    const sa = Array.from({ length: 50 }, () => a.nextInt(37));
    expect(Array.from({ length: 50 }, () => b.nextInt(37))).toEqual(sa);
    expect(Array.from({ length: 50 }, () => c.nextInt(37))).not.toEqual(sa);
  });

  it.each([["crypto", cryptoRng()], ["seeded", seededRng("uniform")]] as const)(
    "%s RNG is uniform over 37 pockets (chi-square)",
    (_, rng) => {
      const N = 370_000;
      const counts = new Array(37).fill(0);
      for (let i = 0; i < N; i++) counts[rng.nextInt(37)]++;
      // df = 36; the 99.99th percentile is ~ 77.
      expect(chiSquare(counts, N / 37)).toBeLessThan(77);
    },
  );

  it("American spins reach 00 and every pocket", () => {
    const rng = seededRng("us");
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) seen.add(spinPocket("american", rng));
    expect(seen.size).toBe(38);
    expect(seen.has(DOUBLE_ZERO)).toBe(true);
  });

  it("European spins never produce 00", () => {
    const rng = seededRng("eu");
    for (let i = 0; i < 5000; i++) expect(spinPocket("european", rng)).not.toBe(DOUBLE_ZERO);
  });
});
