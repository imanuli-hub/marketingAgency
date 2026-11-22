"use client";
import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, GraduationCap, Info, OctagonAlert } from "lucide-react";
import { analyze } from "@/lib/coach/coach";
import type { CoachInput, CoachMode, Insight } from "@/lib/coach/types";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";

const ICON = { info: Info, good: CheckCircle2, warn: AlertTriangle, danger: OctagonAlert } as const;
const TONE = {
  info: "border-info/25 bg-info/5 [&_svg]:text-info",
  good: "border-good/25 bg-good/5 [&_svg]:text-good",
  warn: "border-warn/30 bg-warn/5 [&_svg]:text-warn",
  danger: "border-danger/40 bg-danger/10 [&_svg]:text-danger",
} as const;

export function InsightCard({ insight }: { insight: Insight }) {
  const Icon = ICON[insight.tone];
  return (
    <div className={cn("flex gap-2.5 rounded-xl border p-3", TONE[insight.tone])}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-medium">{insight.title}</div>
        <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/75">{insight.body}</p>
      </div>
    </div>
  );
}

export function CoachPanel({ input, limit = 6 }: { input: Omit<CoachInput, "mode">; limit?: number }) {
  const mode = useAppStore((s) => s.settings.coachMode);
  const update = useAppStore((s) => s.updateSettings);
  const insights = useMemo(() => analyze({ ...input, mode }), [input, mode]);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-display text-lg"><GraduationCap className="size-5 text-gold" /> Coach</div>
        <div className="flex rounded-lg border border-border p-0.5 text-xs" role="radiogroup" aria-label="Coaching level">
          {(["beginner", "intermediate", "advanced"] as CoachMode[]).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => update({ coachMode: m })}
              className={cn("rounded-md px-2 py-1 capitalize touch-manipulation", mode === m ? "bg-gold/20 text-gold-strong" : "text-muted")}>
              {m === "intermediate" ? "Inter." : m}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2" aria-live="polite">
        {insights.slice(0, limit).map((i) => <InsightCard key={i.id} insight={i} />)}
      </div>
      <p className="text-[11px] text-muted">The coach explains maths and habits. It never predicts numbers — every spin is independent.</p>
    </div>
  );
}
