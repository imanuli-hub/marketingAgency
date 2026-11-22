"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckSquare, ChevronDown, Landmark, PlayCircle, Square } from "lucide-react";
import { PlanForm } from "@/components/casino/plan-form";
import { PageHeader } from "@/components/layout/page-header";
import { LessonSections } from "@/app/program/[day]/day-lesson";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/form";
import { CASINO_GUIDE, READINESS_CHECKLIST } from "@/lib/content/casino";
import { HOUSE_EDGE } from "@/lib/roulette/probability";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";

export function CasinoGuide() {
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const done = useAppStore((s) => s.exercisesDone);
  const mark = useAppStore((s) => s.markExercise);
  const [open, setOpen] = useState<string | null>("chips");
  const checked = READINESS_CHECKLIST.filter((c) => done[`check-${c.id}`]).length;

  return (
    <>
      <PageHeader eyebrow="Real casino preparation" title="Casino Ready"
        description="Everything that happens at a real roulette table — from buying chips to leaving on plan — plus a timed casino rehearsal with a fixed budget and stopping rules."
        actions={<Button asChild><Link href="/casino/session"><PlayCircle /> Start casino rehearsal</Link></Button>} />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-2">
          {CASINO_GUIDE.map((t) => {
            const isOpen = open === t.id;
            return (
              <Card key={t.id} className={cn(isOpen && "border-gold/40")}>
                <button className="flex w-full items-center gap-3 p-4 text-left touch-manipulation" onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen}>
                  <Landmark className="size-5 shrink-0 text-gold" />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg">{t.title}</div>
                    <div className="text-sm text-muted">{t.summary}</div>
                  </div>
                  <ChevronDown className={cn("size-5 text-muted transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && <CardContent className="pt-0"><LessonSections sections={t.sections} /></CardContent>}
              </Card>
            );
          })}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Your casino plan</CardTitle><CardDescription>Used by the casino rehearsal. Write the same plan on your phone for the real visit.</CardDescription></CardHeader>
            <CardContent><PlanForm plan={settings.casinoPlan} onChange={(p) => update({ casinoPlan: p })} edge={settings.wheel === "european" ? HOUSE_EDGE.european : HOUSE_EDGE.american} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Readiness checklist</CardTitle><CardDescription>{checked}/{READINESS_CHECKLIST.length} confirmed</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              <Progress value={checked / READINESS_CHECKLIST.length} tone="good" />
              {READINESS_CHECKLIST.map((c) => {
                const on = !!done[`check-${c.id}`];
                return (
                  <button key={c.id} onClick={() => !on && mark(`check-${c.id}`)} className="flex w-full items-start gap-2 rounded-lg p-1.5 text-left text-sm hover:bg-white/5">
                    {on ? <CheckSquare className="mt-0.5 size-4 shrink-0 text-good" /> : <Square className="mt-0.5 size-4 shrink-0 text-muted" />}
                    <span className={on ? "text-foreground" : "text-muted"}>{c.label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-sm text-muted">
              If gambling ever stops feeling like entertainment, talk to someone. Most countries have free, confidential responsible-gambling helplines.
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
