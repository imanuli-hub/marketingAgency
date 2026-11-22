"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { compareStrategies, monteCarlo, type SimConfig, type SimSummary } from "@/lib/roulette/simulator";
import type { StrategyId } from "@/lib/roulette/strategies";
import type { SimJob, SimRequest } from "@/workers/sim.worker";

type Status = "idle" | "running" | "done" | "error";

/** Runs Monte Carlo simulations in a Web Worker (falls back to the main thread). */
export function useSimulation() {
  const worker = useRef<Worker | null>(null);
  const reqId = useRef(0);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SimSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => worker.current?.terminate(), []);

  const getWorker = () => {
    if (worker.current) return worker.current;
    try {
      worker.current = new Worker(new URL("../workers/sim.worker.ts", import.meta.url), { type: "module" });
    } catch {
      worker.current = null;
    }
    return worker.current;
  };

  const run = useCallback((req: SimJob) => {
    const id = ++reqId.current;
    setStatus("running");
    setProgress(0);
    setError(null);
    const w = getWorker();
    if (!w) {
      // Main-thread fallback (deferred so the UI can paint "running").
      setTimeout(() => {
        try {
          const r = req.kind === "single" ? [monteCarlo(req.config)] : compareStrategies(req.config, req.strategies);
          setResults(r); setStatus("done");
        } catch (e) { setError(String(e)); setStatus("error"); }
      }, 30);
      return;
    }
    w.onmessage = (e: MessageEvent<{ id: number; type: string; p?: number; result?: SimSummary[]; message?: string }>) => {
      if (e.data.id !== reqId.current) return;
      if (e.data.type === "progress") setProgress(e.data.p ?? 0);
      else if (e.data.type === "done") { setResults(e.data.result ?? null); setStatus("done"); setProgress(1); }
      else { setError(e.data.message ?? "Simulation failed"); setStatus("error"); }
    };
    w.onerror = (ev) => { setError(ev.message || "Worker error"); setStatus("error"); };
    w.postMessage({ ...req, id } as SimRequest);
  }, []);

  const cancel = useCallback(() => {
    worker.current?.terminate();
    worker.current = null;
    reqId.current++;
    setStatus("idle");
  }, []);

  return { status, progress, results, error, run, cancel };
}

export type { SimConfig, StrategyId };
