"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Lightbulb, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { GameSurface } from "@/components/roulette/game-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useRouletteGame } from "@/hooks/use-roulette-game";
import { useLocale, useT } from "@/lib/i18n";
import { betLabel } from "@/lib/i18n/bet-labels";
import { GUIDED_STEPS, matchesStep } from "@/lib/training/guided";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";
import { fmtMoney } from "@/lib/utils/format";

export function GuidedPractice() {
  const t = useT();
  const locale = useLocale();
  const session = useAppStore((s) => s.current.guided);
  const startSession = useAppStore((s) => s.startSession);
  const endSession = useAppStore((s) => s.endSession);
  const profile = useAppStore((s) => s.settings.profile);
  const done = useAppStore((s) => s.exercisesDone);
  const markExercise = useAppStore((s) => s.markExercise);
  const [stepIdx, setStepIdx] = useState(() => Math.max(0, GUIDED_STEPS.findIndex((s) => !done[`guided-${s.id}`])));
  const [explainFirst, setExplainFirst] = useState(true);
  const [guess, setGuess] = useState("");
  const [checked, setChecked] = useState<boolean | null>(null);
  const step = GUIDED_STEPS[stepIdx];
  const game = useRouletteGame("guided", {
    afterSpin: () => markExercise(`guided-${step.id}`),
  });

  // The tutorial uses its own virtual wallet so it never touches your practice bankroll.
  useEffect(() => {
    if (!session) startSession("guided", { balance: profile.bankroll });
  }, [session, startSession, profile.bankroll]);
  const { setChip } = game;
  useEffect(() => { setChip(2); }, [setChip, stepIdx]);

  const matched = matchesStep(step, game.activeBets);
  const wrong = game.activeBets.filter((b) => !step.bets.some((s) => s.spec.key === b.key));
  const goTo = (i: number) => { setStepIdx(i); setGuess(""); setChecked(null); game.resetTable(); };
  const finishedStep = game.phase === "result" && !!game.settlement;
  const completed = GUIDED_STEPS.filter((s) => done[`guided-${s.id}`]).length;

  return (
    <>
      <PageHeader eyebrow={t("guided.eyebrow")} title={t("guided.title")} description={t("guided.desc")}
        actions={<Button variant="secondary" asChild><Link href="/play">{t("guided.free")}</Link></Button>} />

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label={t("guided.steps")}>
        {GUIDED_STEPS.map((s, i) => (
          <button key={s.id} role="tab" aria-selected={i === stepIdx} onClick={() => goTo(i)}
            className={cn("flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm touch-manipulation", i === stepIdx ? "border-gold/60 bg-gold/15 text-gold-strong" : "border-border text-muted")}>
            {done[`guided-${s.id}`] ? <CheckCircle2 className="size-4 text-good" aria-hidden /> : <Circle className="size-4" aria-hidden />}
            {i + 1}. {s.bets.map((b) => betLabel(b.spec, locale)).join(" + ")}
          </button>
        ))}
      </div>

      <GameSurface
        game={game}
        targets={game.phase === "result" ? undefined : step.bets.map((b) => b.spec)}
        explainResults
        lockChips
        hideSpin={!matched || checked === null}
        bettingLocked={finishedStep}
        status={
          <Card className="border-gold/40">
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-xl">{t("guided.stepOf", { n: stepIdx + 1, total: GUIDED_STEPS.length })}: {step.instruction[locale]}</CardTitle>
              <Badge variant="muted">{t(`guided.group.${step.group}`)}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-muted">
                <Switch checked={explainFirst} onCheckedChange={setExplainFirst} aria-label={t("guided.explainFirst")} /> {t("guided.explainFirst")}
              </label>
              {explainFirst && <p className="flex gap-2 rounded-xl bg-info/10 p-3 text-sm"><Lightbulb className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />{step.explain[locale]}</p>}

              {!finishedStep && wrong.length > 0 && (
                <p className="flex gap-2 rounded-xl bg-warn/10 p-3 text-sm text-warn" role="alert">
                  <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t("guided.wrong", { placed: wrong.map((b) => betLabel(b, locale)).join(", "), target: step.bets.map((b) => betLabel(b.spec, locale)).join(" + ") })}
                </p>
              )}
              {!finishedStep && !matched && wrong.length === 0 && <p className="text-sm text-muted">{t("guided.tapTarget")}</p>}

              {matched && !finishedStep && (
                <div className="space-y-2 rounded-xl border border-border bg-surface-2/50 p-3">
                  <p className="flex items-center gap-2 text-sm text-good"><CheckCircle2 className="size-4" aria-hidden /> {t("guided.placed")}</p>
                  <label className="block text-sm font-medium" htmlFor="guess">{step.question[locale]}</label>
                  <div className="flex gap-2">
                    <Input id="guess" type="number" inputMode="decimal" className="max-w-40" value={guess} onChange={(e) => { setGuess(e.target.value); setChecked(null); }} placeholder="€" />
                    <Button variant="outline" disabled={guess === ""} onClick={() => setChecked(Math.abs(Number(guess) - step.answer) < 0.01)}>{t("guided.check")}</Button>
                    {checked === null && <Button variant="ghost" onClick={() => setChecked(false)}>{t("guided.reveal")}</Button>}
                  </div>
                  {checked !== null && (
                    <p className={cn("text-sm", checked ? "text-good" : "text-warn")}>
                      {checked ? t("guided.correct", { answer: fmtMoney(step.answer) }) : t("guided.answerIs", { answer: fmtMoney(step.answer) })} {t("guided.nowSpin")}
                    </p>
                  )}
                </div>
              )}

              {finishedStep && (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-good">{t("guided.stepDone")}</p>
                  {stepIdx < GUIDED_STEPS.length - 1
                    ? <Button onClick={() => goTo(stepIdx + 1)}>{t("guided.next")} <ArrowRight className="rtl:-scale-x-100" /></Button>
                    : <Button asChild><Link href="/program">{t("guided.backToProgram")}</Link></Button>}
                  <Button variant="ghost" onClick={() => goTo(stepIdx)}>{t("guided.again")}</Button>
                </div>
              )}
            </CardContent>
          </Card>
        }
        aside={
          <Card>
            <CardHeader><CardTitle>{t("guided.progress")}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{t("guided.progressText", { done: completed, total: GUIDED_STEPS.length })}</p>
              <p className="text-muted">{t("guided.wallet", { amount: fmtMoney(game.balance) })}</p>
              <div className="flex flex-wrap gap-2">
                {stepIdx > 0 && <Button size="sm" variant="ghost" onClick={() => goTo(stepIdx - 1)}><ArrowLeft className="rtl:-scale-x-100" /> {t("guided.prev")}</Button>}
                <Button size="sm" variant="secondary" onClick={() => { endSession("guided", "manual"); game.resetTable(); }}>{t("guided.resetWallet")}</Button>
              </div>
              <p className="text-xs text-muted">{t("guided.virtual")}</p>
            </CardContent>
          </Card>
        }
      />
    </>
  );
}
