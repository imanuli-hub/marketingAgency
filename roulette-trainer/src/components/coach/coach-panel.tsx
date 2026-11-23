"use client";
import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, GraduationCap, Info, OctagonAlert } from "lucide-react";
import { analyze } from "@/lib/coach/coach";
import type { CoachInput, CoachMode, Insight } from "@/lib/coach/types";
import { useLocale, useT } from "@/lib/i18n";
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
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <div className="text-sm font-medium">{insight.title}</div>
        <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/75">{insight.body}</p>
      </div>
    </div>
  );
}

export function CoachModeSwitch() {
  const mode = useAppStore((s) => s.settings.coachMode);
  const update = useAppStore((s) => s.updateSettings);
  const t = useT();
  return (
    <div className="flex rounded-lg border border-border p-0.5 text-xs" role="radiogroup" aria-label={t("coach.level")}>
      {(["beginner", "intermediate", "advanced"] as CoachMode[]).map((m) => (
        <button key={m} role="radio" aria-checked={mode === m} onClick={() => update({ coachMode: m })}
          className={cn("min-h-8 rounded-md px-2 touch-manipulation", mode === m ? "bg-gold/20 text-gold-strong" : "text-muted")}>
          {t(`coach.mode.${m}`)}
        </button>
      ))}
    </div>
  );
}

export function CoachPanel({ input, limit = 7 }: { input: Omit<CoachInput, "mode" | "locale">; limit?: number }) {
  const mode = useAppStore((s) => s.settings.coachMode);
  const locale = useLocale();
  const t = useT();
  const insights = useMemo(() => analyze({ ...input, mode, locale }), [input, mode, locale]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-display text-lg"><GraduationCap className="size-5 text-gold" /> {t("coach.title")}</div>
        <CoachModeSwitch />
      </div>
      <div className="space-y-2" aria-live="polite">
        {insights.slice(0, limit).map((i) => <InsightCard key={i.id} insight={i} />)}
      </div>
      <p className="text-[11px] text-muted">{t("coach.disclaimer")}</p>
    </div>
  );
}
