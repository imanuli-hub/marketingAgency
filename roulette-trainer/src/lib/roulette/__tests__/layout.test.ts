import { describe, expect, it } from "vitest";
import { allBetSpecs } from "../bets";
import { anchorFor, hitTest, orient, unorient } from "../layout";

describe("table geometry", () => {
  for (const wheel of ["european", "american"] as const) {
    it(`${wheel}: every bet's chip anchor resolves back to the same bet`, () => {
      for (const spec of allBetSpecs(wheel)) {
        const hit = hitTest(anchorFor(spec, wheel), wheel);
        expect(hit?.key, spec.key).toBe(spec.key);
      }
    });
  }
  it("cell centres are straight-up bets", () => {
    expect(hitTest({ x: 0.5, y: 2.5 }, "european")?.key).toBe("straight:1");
    expect(hitTest({ x: 11.5, y: 0.5 }, "european")?.key).toBe("straight:36");
    expect(hitTest({ x: -0.5, y: 0.5 }, "american")?.key).toBe("straight:00");
  });
  it("orientation transform is invertible", () => {
    const p = { x: 7.3, y: 1.2 };
    const q = unorient(orient(p, "vertical"), "vertical");
    expect(q.x).toBeCloseTo(p.x);
    expect(q.y).toBeCloseTo(p.y);
  });
});
