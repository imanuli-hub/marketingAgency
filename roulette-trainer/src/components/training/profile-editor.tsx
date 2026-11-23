"use client";
import { useState } from "react";
import { Info, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { useLocale, useT, type MessageKey } from "@/lib/i18n";
import { strategyInfo } from "@/lib/content/strategies.he";
import { STRATEGY_IDS, type StrategyId } from "@/lib/roulette/strategies";
import type { WheelType } from "@/lib/roulette/wheel";
import { validateProfile, type TrainingProfile } from "@/lib/training/profile";
import { useAppStore } from "@/store/app-store";
import { fmtMoney, fmtPct } from "@/lib/utils/format";

export function StopRulesNote() {
  const t = useT();
  return (
    <p className="flex gap-2 rounded-xl border border-info/30 bg-info/5 p-3 text-xs leading-relaxed text-foreground/80">
      <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden /> {t("profile.stopNote")}
    </p>
  );
}

export function ProfileSummary({ compact }: { compact?: boolean }) {
  const p = useAppStore((s) => s.settings.profile);
  const t = useT();
  const locale = useLocale();
  const items: [string, string][] = [
    [t("profile.bankroll"), fmtMoney(p.bankroll)],
    [t("profile.baseBet"), `${fmtMoney(p.baseBet)} (${fmtPct(p.baseBet / p.bankroll, 0)})`],
    [t("profile.wheel"), t(p.wheel === "european" ? "wheel.european" : "wheel.american")],
    [t("profile.session"), t("profile.minutes", { min: p.sessionMinMins, max: p.sessionMaxMins })],
    [t("profile.target"), fmtMoney(p.profitTarget, { sign: true })],
    [t("profile.stopLoss"), fmtMoney(-p.stopLoss)],
    [t("profile.strategy"), strategyInfo(p.strategy, locale).name],
  ];
  return (
    <dl className={compact ? "grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4" : "grid grid-cols-2 gap-x-4 gap-y-2 text-sm"}>
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-[11px] uppercase tracking-wide text-muted">{k}</dt>
          <dd className="truncate font-medium tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProfileEditor({ trigger }: { trigger?: (open: () => void) => React.ReactNode }) {
  const t = useT();
  const locale = useLocale();
  const profile = useAppStore((s) => s.settings.profile);
  const apply = useAppStore((s) => s.applyProfile);
  const hasPractice = useAppStore((s) => !!s.current.practice);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TrainingProfile>(profile);
  const [resetBank, setResetBank] = useState(false);
  const issues = validateProfile(draft);
  const num = (k: keyof TrainingProfile) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, [k]: Number(e.target.value) });
  const err = (k: keyof TrainingProfile) => issues.find((i) => i.field === k);
  const show = () => { setDraft(profile); setResetBank(false); setOpen(true); };

  return (
    <>
      {trigger ? trigger(show) : <Button variant="secondary" size="sm" onClick={show}><Pencil /> {t("profile.edit")}</Button>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogTitle>{t("profile.title")}</DialogTitle>
          <DialogDescription>{t("profile.desc")}</DialogDescription>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(["bankroll", "baseBet", "profitTarget", "stopLoss", "sessionMinMins", "sessionMaxMins"] as const).map((k) => (
              <Field key={k} label={t(`profile.field.${k}` as MessageKey)} hint={err(k) ? <span className="text-danger">{t(`profile.err.${err(k)!.code}` as MessageKey)}</span> : undefined}>
                <Input type="number" inputMode="decimal" min={0} step={k.includes("Mins") ? 5 : 1} value={draft[k]} onChange={num(k)} aria-invalid={!!err(k)} />
              </Field>
            ))}
            <Field label={t("profile.wheel")}>
              <Select value={draft.wheel} onChange={(e) => setDraft({ ...draft, wheel: e.target.value as WheelType })}>
                <option value="european">{t("wheel.european")}</option>
                <option value="american">{t("wheel.american")}</option>
              </Select>
            </Field>
            <Field label={t("profile.strategy")}>
              <Select value={draft.strategy} onChange={(e) => setDraft({ ...draft, strategy: e.target.value as StrategyId })}>
                {STRATEGY_IDS.filter((s) => s !== "mixed" && s !== "percentage").map((id) => <option key={id} value={id}>{strategyInfo(id, locale).name}</option>)}
              </Select>
            </Field>
          </div>
          <div className="mt-4"><StopRulesNote /></div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-5 accent-[var(--gold)]" checked={resetBank} disabled={hasPractice} onChange={(e) => setResetBank(e.target.checked)} />
            {t("profile.resetBankroll", { amount: fmtMoney(draft.bankroll) })}
          </label>
          {hasPractice && <p className="mt-1 text-xs text-warn">{t("profile.sessionActive")}</p>}
          <div className="mt-5 flex gap-2">
            <Button disabled={issues.length > 0} onClick={() => { apply(draft, { resetBankroll: resetBank }); setOpen(false); }}>{t("common.save")}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
