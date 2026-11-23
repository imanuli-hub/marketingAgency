"use client";
import { Field, Input } from "@/components/ui/form";
import { useT } from "@/lib/i18n";
import type { CasinoPlan } from "@/store/app-store";
import { fmtMoney, fmtPct } from "@/lib/utils/format";

export function PlanForm({ plan, onChange, edge }: { plan: CasinoPlan; onChange: (p: CasinoPlan) => void; edge: number }) {
  const t = useT();
  const set = (k: keyof CasinoPlan) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...plan, [k]: Math.max(0, Number(e.target.value)) });
  const expectedCost = plan.unit * 35 * (plan.timeLimitMins / 60) * edge;
  const unitPct = plan.budget ? plan.unit / plan.budget : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label={t("plan.budget")}><Input type="number" min={1} value={plan.budget} onChange={set("budget")} /></Field>
        <Field label={t("plan.unit")}><Input type="number" min={1} value={plan.unit} onChange={set("unit")} /></Field>
        <Field label={t("plan.stopLoss")}><Input type="number" min={1} max={plan.budget} value={plan.stopLoss} onChange={set("stopLoss")} /></Field>
        <Field label={t("plan.stopWin")}><Input type="number" min={0} value={plan.stopWin} onChange={set("stopWin")} /></Field>
        <Field label={t("plan.time")}><Input type="number" min={5} value={plan.timeLimitMins} onChange={set("timeLimitMins")} /></Field>
        <Field label={t("plan.betting")}><Input type="number" min={5} max={60} value={plan.bettingSeconds} onChange={set("bettingSeconds")} /></Field>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-xl bg-black/30 p-3"><div className="text-xs text-muted">{t("plan.unitSize")}</div><div className={unitPct > 0.05 ? "text-warn" : "text-good"}>{t(unitPct > 0.05 ? "plan.aggressive" : "plan.sustainable", { p: fmtPct(unitPct) })}</div></div>
        <div className="rounded-xl bg-black/30 p-3"><div className="text-xs text-muted">{t("plan.expCost")}</div><div>{t("plan.expCostValue", { amount: fmtMoney(expectedCost, { decimals: 2 }), min: plan.timeLimitMins })}</div></div>
        <div className="rounded-xl bg-black/30 p-3"><div className="text-xs text-muted">{t("plan.stopLoss")}</div><div>{plan.stopLoss > plan.budget ? <span className="text-danger">{t("plan.exceeds")}</span> : t("plan.units", { n: Math.floor(plan.stopLoss / Math.max(1, plan.unit)) })}</div></div>
      </div>
    </div>
  );
}
