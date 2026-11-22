"use client";
import { useState } from "react";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import type { EvenMoneyRule } from "@/lib/roulette/engine";
import type { WheelType } from "@/lib/roulette/wheel";
import type { CoachMode } from "@/lib/coach/types";
import { useAppStore, type MotionPref, type OrientationPref } from "@/store/app-store";
import { fmtMoney } from "@/lib/utils/format";

export function SettingsForm() {
  const s = useAppStore((st) => st.settings);
  const update = useAppStore((st) => st.updateSettings);
  const bankroll = useAppStore((st) => st.bankroll);
  const resetBankroll = useAppStore((st) => st.resetBankroll);
  const resetAll = useAppStore((st) => st.resetAll);
  const hasSession = useAppStore((st) => !!st.current.practice || !!st.current.casino);
  const [confirm, setConfirm] = useState(false);
  const num = (k: "minBet" | "maxInside" | "maxOutside" | "startingBankroll" | "breakReminderMins", min = 0) =>
    (e: React.ChangeEvent<HTMLInputElement>) => update({ [k]: Math.max(min, +e.target.value) });

  const exportData = () => {
    const { settings, bankroll, history, lessonsDone, quizzes, exercisesDone } = useAppStore.getState();
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), settings, bankroll, history, lessonsDone, quizzes, exercisesDone }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "roulette-academy-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader eyebrow="Preferences" title="Settings" description="Table rules, limits, bankroll, coaching and accessibility. Everything is stored only on this device." />
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Table</CardTitle><CardDescription>Applies to the practice table and casino rehearsals.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="Roulette type">
              <Select value={s.wheel} disabled={hasSession} onChange={(e) => update({ wheel: e.target.value as WheelType })}>
                <option value="european">European (single zero)</option>
                <option value="american">American (double zero)</option>
              </Select>
            </Field>
            <Field label="Even-money zero rule">
              <Select value={s.wheel === "european" ? s.evenMoneyRule : "none"} disabled={s.wheel !== "european" || hasSession} onChange={(e) => update({ evenMoneyRule: e.target.value as EvenMoneyRule })}>
                <option value="none">Standard</option>
                <option value="laPartage">La Partage</option>
                <option value="enPrison">En Prison</option>
              </Select>
            </Field>
            <Field label="Minimum bet"><Input type="number" min={1} value={s.minBet} onChange={num("minBet", 1)} /></Field>
            <Field label="Max per inside bet"><Input type="number" min={1} value={s.maxInside} onChange={num("maxInside", 1)} /></Field>
            <Field label="Max per outside bet"><Input type="number" min={1} value={s.maxOutside} onChange={num("maxOutside", 1)} /></Field>
            {hasSession && <p className="col-span-2 text-xs text-warn">End your current session to change the wheel or zero rule.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Virtual bankroll</CardTitle><CardDescription>Current balance {fmtMoney(bankroll)}.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Starting bankroll"><Input type="number" min={10} value={s.startingBankroll} onChange={num("startingBankroll", 10)} /></Field>
            <Button variant="secondary" onClick={() => resetBankroll(s.startingBankroll)}><RefreshCw /> Reset bankroll to {fmtMoney(s.startingBankroll)}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Coach & responsible play</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="Coaching level">
              <Select value={s.coachMode} onChange={(e) => update({ coachMode: e.target.value as CoachMode })}>
                <option value="beginner">Beginner — rules & terms</option>
                <option value="intermediate">Intermediate — probability & bankroll</option>
                <option value="advanced">Advanced — EV, variance, risk</option>
              </Select>
            </Field>
            <Field label="Break reminder (minutes, 0 = off)"><Input type="number" min={0} value={s.breakReminderMins} onChange={num("breakReminderMins")} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Display & sound</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div><div className="text-sm">Sound effects</div><div className="text-xs text-muted">Chip clicks, wheel and payout tones</div></div>
              <Switch checked={s.sound} onCheckedChange={(v) => update({ sound: v })} aria-label="Sound effects" />
            </div>
            <Field label="Animation">
              <Select value={s.motion} onChange={(e) => update({ motion: e.target.value as MotionPref })}>
                <option value="system">Follow device setting</option>
                <option value="full">Full animations</option>
                <option value="reduced">Reduced motion</option>
              </Select>
            </Field>
            <Field label="Betting table layout">
              <Select value={s.orientation} onChange={(e) => update({ orientation: e.target.value as OrientationPref })}>
                <option value="auto">Automatic (vertical on phones)</option>
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Your data</CardTitle><CardDescription>Stored in this browser only. Nothing is sent anywhere.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportData}><Download /> Export JSON</Button>
            <Button variant="danger" onClick={() => setConfirm(true)}><Trash2 /> Reset everything</Button>
          </CardContent>
        </Card>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogTitle>Reset all data?</DialogTitle>
          <DialogDescription>This erases your bankroll, session history, lesson progress and quiz scores on this device.</DialogDescription>
          <div className="mt-4 flex gap-2">
            <Button variant="danger" onClick={() => { resetAll(); setConfirm(false); }}>Yes, reset</Button>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
