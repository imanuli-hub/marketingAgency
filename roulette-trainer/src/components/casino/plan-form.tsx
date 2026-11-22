"use client";
import { Field, Input } from "@/components/ui/form";
import type { CasinoPlan } from "@/store/app-store";
import { fmtMoney, fmtPct } from "@/lib/utils/format";

export function PlanForm({ plan, onChange, edge }: { plan: CasinoPlan; onChange: (p: CasinoPlan) => void; edge: number }) {
  const set = (k: keyof CasinoPlan) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...plan, [k]: Math.max(0, +e.target.value) });
  const spinsPerHour = 35;
  const expectedCost = plan.unit * spinsPerHour * (plan.timeLimitMins / 60) * edge;
  const unitPct = plan.budget ? plan.unit / plan.budget : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Total budget ($)"><Input type="number" min={1} value={plan.budget} onChange={set("budget")} /></Field>
        <Field label="Unit / bet size ($)"><Input type="number" min={1} value={plan.unit} onChange={set("unit")} /></Field>
        <Field label="Loss limit ($)"><Input type="number" min={1} max={plan.budget} value={plan.stopLoss} onChange={set("stopLoss")} /></Field>
        <Field label="Win goal ($)"><Input type="number" min={0} value={plan.stopWin} onChange={set("stopWin")} /></Field>
        <Field label="Time limit (min)"><Input type="number" min={5} value={plan.timeLimitMins} onChange={set("timeLimitMins")} /></Field>
        <Field label="Betting time (sec)"><Input type="number" min={5} max={60} value={plan.bettingSeconds} onChange={set("bettingSeconds")} /></Field>
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-xl bg-black/30 p-3"><div className="text-xs text-muted">Unit size</div><div className={unitPct > 0.05 ? "text-warn" : "text-good"}>{fmtPct(unitPct)} of budget {unitPct > 0.05 ? "(aggressive)" : "(sustainable)"}</div></div>
        <div className="rounded-xl bg-black/30 p-3"><div className="text-xs text-muted">Expected cost at 1 unit/spin</div><div>≈ {fmtMoney(expectedCost, { decimals: 2 })} over {plan.timeLimitMins} min</div></div>
        <div className="rounded-xl bg-black/30 p-3"><div className="text-xs text-muted">Loss limit</div><div>{plan.stopLoss > plan.budget ? <span className="text-danger">exceeds budget</span> : `${Math.floor(plan.stopLoss / Math.max(1, plan.unit))} units of losses`}</div></div>
      </div>
    </div>
  );
}
