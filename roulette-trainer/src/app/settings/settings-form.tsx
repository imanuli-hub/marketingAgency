"use client";
import { useState } from "react";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileEditor, ProfileSummary } from "@/components/training/profile-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import type { CoachMode } from "@/lib/coach/types";
import { useT } from "@/lib/i18n";
import type { EvenMoneyRule } from "@/lib/roulette/engine";
import type { WheelType } from "@/lib/roulette/wheel";
import { useAppStore, type MotionPref, type OrientationPref } from "@/store/app-store";
import { fmtMoney, type Currency, type Locale } from "@/lib/utils/format";

export function SettingsForm() {
  const t = useT();
  const s = useAppStore((st) => st.settings);
  const update = useAppStore((st) => st.updateSettings);
  const bankroll = useAppStore((st) => st.bankroll);
  const resetBankroll = useAppStore((st) => st.resetBankroll);
  const resetAll = useAppStore((st) => st.resetAll);
  const hasSession = useAppStore((st) => !!st.current.practice || !!st.current.casino);
  const [confirm, setConfirm] = useState(false);
  const num = (k: "minBet" | "maxInside" | "maxOutside" | "breakReminderMins", min = 0) =>
    (e: React.ChangeEvent<HTMLInputElement>) => update({ [k]: Math.max(min, Number(e.target.value)) });

  const exportData = () => {
    const { settings, bankroll: b, history, lessonsDone, quizzes, exercisesDone } = useAppStore.getState();
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), settings, bankroll: b, history, lessonsDone, quizzes, exercisesDone }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "roulette-academy-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader eyebrow={t("settings.eyebrow")} title={t("settings.title")} description={t("settings.desc")} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <div><CardTitle>{t("dash.profile")}</CardTitle><CardDescription>{t("settings.profileDesc")}</CardDescription></div>
            <ProfileEditor />
          </CardHeader>
          <CardContent><ProfileSummary compact /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("settings.language")}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label={t("settings.language")}>
              <Select value={s.locale} onChange={(e) => update({ locale: e.target.value as Locale })}>
                <option value="he">עברית</option>
                <option value="en">English</option>
              </Select>
            </Field>
            <Field label={t("settings.currency")}>
              <Select value={s.currency} onChange={(e) => update({ currency: e.target.value as Currency })}>
                <option value="EUR">€ EUR</option>
                <option value="USD">$ USD</option>
                <option value="ILS">₪ ILS</option>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("settings.table")}</CardTitle><CardDescription>{t("settings.tableDesc")}</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label={t("simLab.wheel")}>
              <Select value={s.wheel} disabled={hasSession} onChange={(e) => update({ wheel: e.target.value as WheelType })}>
                <option value="european">{t("wheel.european")}</option>
                <option value="american">{t("wheel.american")}</option>
              </Select>
            </Field>
            <Field label={t("simLab.zeroRule")}>
              <Select value={s.wheel === "european" ? s.evenMoneyRule : "none"} disabled={s.wheel !== "european" || hasSession} onChange={(e) => update({ evenMoneyRule: e.target.value as EvenMoneyRule })}>
                <option value="none">{t("rule.none")}</option>
                <option value="laPartage">La Partage</option>
                <option value="enPrison">En Prison</option>
              </Select>
            </Field>
            <Field label={t("simLab.min")}><Input type="number" min={1} value={s.minBet} onChange={num("minBet", 1)} /></Field>
            <Field label={t("simLab.maxIn")}><Input type="number" min={1} value={s.maxInside} onChange={num("maxInside", 1)} /></Field>
            <Field label={t("simLab.maxOut")}><Input type="number" min={1} value={s.maxOutside} onChange={num("maxOutside", 1)} /></Field>
            {hasSession && <p className="col-span-2 text-xs text-warn">{t("settings.endFirst")}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("settings.bankroll")}</CardTitle><CardDescription>{t("settings.current", { amount: fmtMoney(bankroll) })}</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="secondary" disabled={!!useAppStore.getState().current.practice} onClick={() => resetBankroll(s.startingBankroll)}><RefreshCw /> {t("practice.resetBank", { amount: fmtMoney(s.startingBankroll) })}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("settings.responsible")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div><div className="text-sm">{t("settings.enforce")}</div><div className="text-xs text-muted">{t("settings.enforceDesc")}</div></div>
              <Switch checked={s.enforceStopRules} onCheckedChange={(v) => update({ enforceStopRules: v })} aria-label={t("settings.enforce")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("coach.level")}>
                <Select value={s.coachMode} onChange={(e) => update({ coachMode: e.target.value as CoachMode })}>
                  <option value="beginner">{t("coach.mode.beginner")}</option>
                  <option value="intermediate">{t("coach.mode.intermediate")}</option>
                  <option value="advanced">{t("coach.mode.advanced")}</option>
                </Select>
              </Field>
              <Field label={t("settings.break")}><Input type="number" min={0} value={s.breakReminderMins} onChange={num("breakReminderMins")} /></Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("settings.display")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div><div className="text-sm">{t("settings.sound")}</div><div className="text-xs text-muted">{t("settings.soundDesc")}</div></div>
              <Switch checked={s.sound} onCheckedChange={(v) => update({ sound: v })} aria-label={t("settings.sound")} />
            </div>
            <Field label={t("settings.motion")}>
              <Select value={s.motion} onChange={(e) => update({ motion: e.target.value as MotionPref })}>
                <option value="system">{t("settings.motion.system")}</option>
                <option value="full">{t("settings.motion.full")}</option>
                <option value="reduced">{t("settings.motion.reduced")}</option>
              </Select>
            </Field>
            <Field label={t("settings.layout")}>
              <Select value={s.orientation} onChange={(e) => update({ orientation: e.target.value as OrientationPref })}>
                <option value="auto">{t("settings.layout.auto")}</option>
                <option value="horizontal">{t("settings.layout.horizontal")}</option>
                <option value="vertical">{t("settings.layout.vertical")}</option>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("settings.data")}</CardTitle><CardDescription>{t("settings.dataDesc")}</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportData}><Download /> {t("settings.export")}</Button>
            <Button variant="danger" onClick={() => setConfirm(true)}><Trash2 /> {t("settings.resetAll")}</Button>
          </CardContent>
        </Card>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogTitle>{t("settings.resetTitle")}</DialogTitle>
          <DialogDescription>{t("settings.resetBody")}</DialogDescription>
          <div className="mt-4 flex gap-2">
            <Button variant="danger" onClick={() => { resetAll(); setConfirm(false); }}>{t("settings.resetConfirm")}</Button>
            <Button variant="ghost" onClick={() => setConfirm(false)}>{t("common.cancel")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
