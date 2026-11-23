"use client";
import { Info } from "lucide-react";
import type { Pocket } from "@/lib/roulette/wheel";
import { useT } from "@/lib/i18n";
import { PocketBadge } from "./pocket-badge";

/** Recent results, shown with an explicit reminder that they carry no predictive value. */
export function RecentResults({ pockets }: { pockets: Pocket[] }) {
  const t = useT();
  const recent = pockets.slice(-14).reverse();
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
        {t("recent.title")}
        <span className="inline-flex items-center gap-1 normal-case tracking-normal text-muted/80">
          <Info className="size-3" /> {t("recent.noPrediction")}
        </span>
      </div>
      <div dir="ltr" className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label={t("recent.title")}>
        {recent.length === 0 && <span className="text-sm text-muted">{t("recent.none")}</span>}
        {recent.map((p, i) => <PocketBadge key={i} pocket={p} size="sm" className={i === 0 ? "ring-2 ring-gold" : "opacity-80"} />)}
      </div>
    </div>
  );
}
