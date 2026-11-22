/// <reference lib="webworker" />
import { compareStrategies, monteCarlo, type SimConfig } from "@/lib/roulette/simulator";
import type { StrategyId } from "@/lib/roulette/strategies";

export type SimJob =
  | { kind: "single"; config: SimConfig }
  | { kind: "compare"; config: Omit<SimConfig, "strategy">; strategies: StrategyId[] };
export type SimRequest = SimJob & { id: number };

self.onmessage = (e: MessageEvent<SimRequest>) => {
  const req = e.data;
  let last = 0;
  const progress = (p: number) => {
    if (p - last >= 0.02 || p === 1) { last = p; self.postMessage({ id: req.id, type: "progress", p }); }
  };
  try {
    const result = req.kind === "single" ? [monteCarlo(req.config, progress)] : compareStrategies(req.config, req.strategies, progress);
    self.postMessage({ id: req.id, type: "done", result });
  } catch (err) {
    self.postMessage({ id: req.id, type: "error", message: String(err) });
  }
};
