"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckSquare, ChevronDown, Landmark, PlayCircle, Square } from "lucide-react";
import { PlanForm } from "@/components/casino/plan-form";
import { PageHeader } from "@/components/layout/page-header";
import { LessonSections } from "@/app/program/[day]/day-lesson";
import { StopRulesNote } from "@/components/training/profile-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/form";
import { CASINO_GUIDE, READINESS_CHECKLIST } from "@/lib/content/casino";
import { useLocale, useT } from "@/lib/i18n";
import { HOUSE_EDGE } from "@/lib/roulette/probability";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";

export function CasinoGuide() {
  const t = useT();
  const locale = useLocale();
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const done = useAppStore((s) => s.exercisesDone);
  const mark = useAppStore((s) => s.markExercise);
  const [open, setOpen] = useState<string | null>("chips");
  const checklist = READINESS_CHECKLIST[locale];
  const checked = checklist.filter((c) => done[`check-${c.id}`]).length;

  return (
    <>
      <PageHeader eyebrow={t("guide.eyebrow")} title={t("guide.title")} description={t("guide.desc")}
        actions={<Button asChild><Link href="/casino/session"><PlayCircle /> {t("guide.start")}</Link></Button>} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-2">
          {CASINO_GUIDE[locale].map((topic) => {
            const isOpen = open === topic.id;
            return (
              <Card key={topic.id} className={cn(isOpen && "border-gold/40")}>
                <button className="flex min-h-16 w-full items-center gap-3 p-4 text-start touch-manipulation" onClick={() => setOpen(isOpen ? null : topic.id)} aria-expanded={isOpen}>
                  <Landmark className="size-5 shrink-0 text-gold" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg">{topic.title}</div>
                    <div className="text-sm text-muted">{topic.summary}</div>
                  </div>
                  <ChevronDown className={cn("size-5 text-muted transition-transform", isOpen && "rotate-180")} aria-hidden />
                </button>
                {isOpen && <CardContent className="pt-0"><LessonSections sections={topic.sections} /></CardContent>}
              </Card>
            );
          })}
        </div>
        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{t("guide.planTitle")}</CardTitle><CardDescription>{t("guide.planDesc")}</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <PlanForm plan={settings.casinoPlan} onChange={(p) => update({ casinoPlan: p })} edge={settings.wheel === "european" ? HOUSE_EDGE.european : HOUSE_EDGE.american} />
              <StopRulesNote />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t("guide.checklist")}</CardTitle><CardDescription>{t("guide.checked", { n: checked, total: checklist.length })}</CardDescription></CardHeader>
            <CardContent className="space-y-1">
              <Progress value={checked / checklist.length} tone="good" />
              {checklist.map((c) => {
                const on = !!done[`check-${c.id}`];
                return (
                  <button key={c.id} role="checkbox" aria-checked={on} onClick={() => !on && mark(`check-${c.id}`)} className="flex min-h-11 w-full items-start gap-2 rounded-lg p-1.5 text-start text-sm hover:bg-white/5">
                    {on ? <CheckSquare className="mt-0.5 size-5 shrink-0 text-good" aria-hidden /> : <Square className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />}
                    <span className={on ? "text-foreground" : "text-muted"}>{c.label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
          <Card><CardContent className="pt-5 text-sm text-muted">{t("guide.help")}</CardContent></Card>
        </aside>
      </div>
    </>
  );
}
