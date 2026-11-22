"use client";
import { Info } from "lucide-react";
import type { Pocket } from "@/lib/roulette/wheel";
import { PocketBadge } from "./pocket-badge";

/** Recent results. Shown with an explicit reminder that they carry no predictive value. */
export function RecentResults({ pockets }: { pockets: Pocket[] }) {
  const recent = pockets.slice(-14).reverse();
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
        Recent results
        <span className="inline-flex items-center gap-1 normal-case tracking-normal text-muted/80" title="Every spin is independent. Past numbers do not change future probabilities.">
          <Info className="size-3" /> no predictive value
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {recent.length === 0 && <span className="text-sm text-muted">No spins yet</span>}
        {recent.map((p, i) => <PocketBadge key={i} pocket={p} size="sm" className={i === 0 ? "ring-2 ring-gold" : "opacity-80"} />)}
      </div>
    </div>
  );
}
