"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Quiz } from "@/components/learn/quiz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, Stat } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ASSESSMENT } from "@/lib/content/assessment";
import { useLocale, useT, type MessageKey } from "@/lib/i18n";
import { FINAL_SECTIONS, finalQuizId, type FinalSection } from "@/lib/training/program-state";
import { readinessReport } from "@/lib/training/readiness";
import { useAppStore } from "@/store/app-store";
import { fmtPct } from "@/lib/utils/format";

export function Assessment() {
  const t = useT();
  const locale = useLocale();
  const lessonsDone = useAppStore((s) => s.lessonsDone);
  const quizzes = useAppStore((s) => s.quizzes);
  const history = useAppStore((s) => s.history);
  const markLesson = useAppStore((s) => s.markLesson);
  const [tab, setTab] = useState<FinalSection>("knowledge");
  const r = readinessReport(lessonsDone, quizzes, history);
  const allTaken = FINAL_SECTIONS.every((s) => quizzes[finalQuizId(s)]);

  return (
    <>
      <PageHeader eyebrow={t("assess.eyebrow")} title={t("assess.title")} description={t("assess.desc")} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader><CardTitle>{t("assess.sections")}</CardTitle><CardDescription>{t("assess.sectionsDesc")}</CardDescription></CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as FinalSection)}>
              <TabsList className="w-full">
                {FINAL_SECTIONS.map((s) => (
                  <TabsTrigger key={s} value={s} className="flex items-center gap-1.5">
                    {quizzes[finalQuizId(s)] ? <CheckCircle2 className="size-3.5 text-good" aria-hidden /> : <Circle className="size-3.5" aria-hidden />}
                    {t(`final.${s}` as MessageKey)}
                  </TabsTrigger>
                ))}
              </TabsList>
              {FINAL_SECTIONS.map((s) => (
                <TabsContent key={s} value={s}>
                  <p className="mb-3 text-sm text-muted">{t(`final.${s}.desc` as MessageKey)}</p>
                  <Quiz key={`${s}-${locale}`} id={finalQuizId(s)} questions={ASSESSMENT[locale][s]} passMark={0.8} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="border-gold/40">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-gold" /> {t("assess.report")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-baseline justify-between"><span className="text-4xl font-semibold tabular-nums">{fmtPct(r.score, 0)}</span><Badge>{t(`level.${r.level}` as MessageKey)}</Badge></div>
                <Progress value={r.score} className="mt-2" />
              </div>
              <ul className="space-y-2 text-sm">
                {FINAL_SECTIONS.map((s) => (
                  <li key={s} className="flex items-center justify-between gap-2"><span>{t(`final.${s}` as MessageKey)}</span><span className="tabular-nums text-muted">{r.sections[s] === null ? "—" : fmtPct(r.sections[s]!, 0)}</span></li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-2">
                <Stat label={t("assess.knowledge")} value={fmtPct(r.knowledge, 0)} sub={t("assess.weight", { w: "50%" })} />
                <Stat label={t("assess.discipline")} value={r.discipline === null ? "—" : fmtPct(r.discipline, 0)} sub={t("assess.weight", { w: "30%" })} />
                <Stat label={t("assess.completion")} value={fmtPct(r.programCompletion, 0)} sub={t("assess.weight", { w: "20%" })} />
                <Stat label={t("assess.sessions")} value={`${r.sessionsAssessed}/3`} sub={r.sessionScores.map((x) => fmtPct(x, 0)).join(" · ") || "—"} />
              </div>
              <p className="text-xs text-muted">{t("assess.fairness")}</p>
              {r.sessionsAssessed < 3 && (
                <div className="rounded-xl bg-warn/10 p-3 text-sm">
                  {t("assess.needSessions", { n: 3 - r.sessionsAssessed })}
                  <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" asChild><Link href="/play">{t("nav.play")}</Link></Button><Button size="sm" variant="outline" asChild><Link href="/casino/session">{t("assess.rehearsal")}</Link></Button></div>
                </div>
              )}
              {allTaken && !lessonsDone[14] && <Button className="w-full" onClick={() => markLesson(14)}>{t("assess.markDay14")}</Button>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
