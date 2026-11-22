"use client";
import { useMemo, useState } from "react";
import { BettingTable } from "@/components/roulette/betting-table";
import { useTableOrientation } from "@/components/roulette/game-surface";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as B from "@/lib/roulette/bets";
import type { BetSpec } from "@/lib/roulette/bets";
import { DEFAULT_RULES, type EvenMoneyRule, type TableRules } from "@/lib/roulette/engine";
import { betMath } from "@/lib/roulette/probability";
import { DOUBLE_ZERO, type WheelType } from "@/lib/roulette/wheel";
import { cn } from "@/lib/utils/cn";
import { fmtMoney, fmtPct } from "@/lib/utils/format";

interface BetType {
  id: string;
  name: string;
  inside: boolean;
  where: string;
  example: (w: WheelType) => BetSpec;
  wheels?: WheelType[];
}

const BET_TYPES: BetType[] = [
  { id: "straight", name: "Straight up", inside: true, where: "Chip fully inside one number (including 0 or 00).", example: () => B.straight(17) },
  { id: "split", name: "Split", inside: true, where: "Chip on the line between two adjacent numbers.", example: () => B.split(17, 20) },
  { id: "street", name: "Street", inside: true, where: "Chip on the outer edge of a row of three numbers (next to the dozens).", example: () => B.street(16) },
  { id: "corner", name: "Corner", inside: true, where: "Chip on the point where four numbers meet.", example: () => B.corner(17) },
  { id: "sixLine", name: "Six line", inside: true, where: "Chip on the outer edge where two streets meet.", example: () => B.sixLine(16) },
  { id: "trio", name: "Trio", inside: true, where: "Chip where 0 meets two numbers (0-1-2 or 0-2-3).", example: (w) => B.trio([0, 1, 2], w) },
  { id: "firstFour", name: "First four", inside: true, where: "Chip at the corner of 0, 1, 2, 3 (European).", example: () => B.firstFour(), wheels: ["european"] },
  { id: "basket", name: "Basket / top line", inside: true, where: "Chip at the corner of 0, 00, 1, 2, 3 (American). Worst bet on the table.", example: () => B.basket(), wheels: ["american"] },
  { id: "dozen", name: "Dozen", inside: false, where: "Chip in the 1st 12, 2nd 12 or 3rd 12 box.", example: () => B.dozen(2) },
  { id: "column", name: "Column", inside: false, where: "Chip in a '2 to 1' box at the end of a column.", example: () => B.column(2) },
  { id: "red", name: "Red / Black", inside: false, where: "Chip on the red or black diamond.", example: () => B.red() },
  { id: "odd", name: "Odd / Even", inside: false, where: "Chip in the ODD or EVEN box.", example: () => B.odd() },
  { id: "low", name: "Low / High", inside: false, where: "Chip in 1–18 or 19–36.", example: () => B.low() },
];

function MathRow({ spec, rules, stake = 10 }: { spec: BetSpec; rules: TableRules; stake?: number }) {
  const m = betMath(spec, rules);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Stat label="Payout" value={`${spec.payout} : 1`} sub={`${fmtMoney(stake)} wins ${fmtMoney(stake * spec.payout)}`} tone="gold" />
      <Stat label="Total returned" value={fmtMoney(stake * (spec.payout + 1))} sub="winnings + your stake" />
      <Stat label="Chance to win" value={fmtPct(m.pWin, 2)} sub={`${spec.numbers.length} of ${rules.wheel === "european" ? 37 : 38} pockets`} />
      <Stat label="True odds" value={m.trueOdds} sub={`casino pays ${spec.payout} to 1`} />
      <Stat label={`Expected value on ${fmtMoney(stake)}`} value={fmtMoney(m.ev * stake, { decimals: 2 })} sub="average result per spin" tone="danger" />
      <Stat label="House edge" value={fmtPct(m.houseEdge, 2)} sub={`σ ≈ ${m.sd.toFixed(2)} units per spin`} />
    </div>
  );
}

export function BetsGuide() {
  const [wheel, setWheel] = useState<WheelType>("european");
  const [rule, setRule] = useState<EvenMoneyRule>("none");
  const rules: TableRules = { ...DEFAULT_RULES, wheel, evenMoneyRule: wheel === "european" ? rule : "none" };
  const types = BET_TYPES.filter((t) => !t.wheels || t.wheels.includes(wheel));
  const [typeId, setTypeId] = useState("straight");
  const [explored, setExplored] = useState<BetSpec | null>(null);
  const orientation = useTableOrientation();
  const type = types.find((t) => t.id === typeId) ?? types[0];
  const spec = explored ?? type.example(wheel);

  const tableRows = useMemo(() => {
    const kinds: [string, BetSpec, BetSpec][] = [
      ["Straight up", B.straight(17), B.straight(17, "american")],
      ["Split", B.split(17, 20), B.split(17, 20)],
      ["Street / Trio", B.street(16), B.street(16)],
      ["Corner", B.corner(17), B.corner(17)],
      ["First four (EU) / Basket (US)", B.firstFour(), B.basket()],
      ["Six line", B.sixLine(16), B.sixLine(16)],
      ["Dozen / Column", B.dozen(1), B.dozen(1)],
      ["Red/Black, Odd/Even, Low/High", B.red(), B.red()],
    ];
    const eu: TableRules = { ...DEFAULT_RULES, wheel: "european", evenMoneyRule: "none" };
    const us: TableRules = { ...DEFAULT_RULES, wheel: "american", evenMoneyRule: "none" };
    return kinds.map(([name, e, a]) => ({ name, payout: e.kind === "firstFour" ? "8:1 / 6:1" : `${e.payout}:1`, eu: betMath(e, eu), us: betMath(a, us) }));
  }, []);

  return (
    <>
      <PageHeader eyebrow="Betting education" title="Bets & Odds" description="Every bet on the layout: where the chip goes, what it pays, how likely it is to win, and what it costs on average. Tap anywhere on the demo table to explore." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tabs value={wheel} onValueChange={(v) => { setWheel(v as WheelType); setExplored(null); }}>
          <TabsList>
            <TabsTrigger value="european">European · single zero</TabsTrigger>
            <TabsTrigger value="american">American · double zero</TabsTrigger>
          </TabsList>
        </Tabs>
        {wheel === "european" && (
          <Tabs value={rule} onValueChange={(v) => setRule(v as EvenMoneyRule)}>
            <TabsList>
              <TabsTrigger value="none">Standard</TabsTrigger>
              <TabsTrigger value="laPartage">La Partage</TabsTrigger>
              <TabsTrigger value="enPrison">En Prison</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="pt-4">
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible [scrollbar-width:none]">
              {types.map((t) => (
                <button key={t.id} onClick={() => { setTypeId(t.id); setExplored(null); }}
                  className={cn("flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm touch-manipulation", t.id === type.id && !explored ? "bg-gold/15 text-gold-strong" : "text-muted hover:bg-white/5 hover:text-foreground")}>
                  <span>{t.name}</span>
                  <Badge variant={t.inside ? "info" : "muted"}>{t.example(wheel).payout}:1</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{explored ? explored.label : type.name}</CardTitle>
                <Badge variant={B.INSIDE_KINDS.has(spec.kind) ? "info" : "muted"}>{B.INSIDE_KINDS.has(spec.kind) ? "Inside bet" : "Outside bet"}</Badge>
                {explored && <button className="text-xs text-gold underline" onClick={() => setExplored(null)}>back to example</button>}
              </div>
              <CardDescription>{explored ? `Covers ${spec.numbers.map((n) => (n === DOUBLE_ZERO ? "00" : n)).join(", ")}.` : `${type.where} Example: ${spec.label}.`}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BettingTable wheel={wheel} orientation={orientation} bets={[B.place(spec, 10)]} highlight={spec.numbers} onPlace={setExplored}
                className={orientation === "vertical" ? "mx-auto max-w-[380px]" : undefined} ariaLabel="Demonstration layout — tap to explore bets" />
              <MathRow spec={spec} rules={rules} />
              {B.isEvenMoney(spec.kind) && rules.evenMoneyRule !== "none" && (
                <p className="rounded-xl bg-good/10 p-3 text-sm text-good">
                  {rules.evenMoneyRule === "laPartage" ? "La Partage: if 0 hits you get half your stake back, halving the edge to 1.35%." : "En Prison: if 0 hits your stake is held for one spin; win it and it's returned. Edge ≈ 1.39%."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payouts, probability and house edge</CardTitle><CardDescription>Probability and expected value per $1 wagered, European vs American.</CardDescription></CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[560px] text-sm tabular-nums">
                  <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                    <tr><th className="px-3 py-2">Bet</th><th className="px-3 py-2">Pays</th><th className="px-3 py-2">P(win) EU</th><th className="px-3 py-2">EV/$1 EU</th><th className="px-3 py-2">P(win) US</th><th className="px-3 py-2">EV/$1 US</th></tr>
                  </thead>
                  <tbody>
                    {tableRows.map((r) => (
                      <tr key={r.name} className="border-t border-border/60">
                        <td className="px-3 py-2">{r.name}</td>
                        <td className="px-3 py-2 text-gold-strong">{r.payout}</td>
                        <td className="px-3 py-2">{fmtPct(r.eu.pWin, 2)}</td>
                        <td className="px-3 py-2">−{(r.eu.houseEdge * 100).toFixed(2)}¢</td>
                        <td className="px-3 py-2">{fmtPct(r.us.pWin, 2)}</td>
                        <td className={cn("px-3 py-2", r.us.houseEdge > 0.06 && "text-danger")}>−{(r.us.houseEdge * 100).toFixed(2)}¢</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-muted">Notice the pattern: on a given wheel, every bet costs the same on average (except the American basket). Choosing between bets changes <em>how often</em> and <em>how much</em> you win — never the long-run cost.</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>European vs American</CardTitle></CardHeader>
              <CardContent className="prose-casino text-sm">
                <ul>
                  <li><strong>European:</strong> 37 pockets (0–36). House edge 2.70% on every bet.</li>
                  <li><strong>American:</strong> 38 pockets (0, 00, 1–36). Same payouts, so the edge rises to 5.26% — nearly double.</li>
                  <li>On $10 × 35 spins/hour: about <strong>$9.46/hour</strong> expected cost on European vs <strong>$18.42/hour</strong> on American.</li>
                  <li>The American basket (0-00-1-2-3) pays 6:1 for 5 numbers: 7.89% edge.</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>La Partage & En Prison</CardTitle></CardHeader>
              <CardContent className="prose-casino text-sm">
                <p>Optional rules on some single-zero tables that soften the zero for <strong>even-money bets only</strong>:</p>
                <ul>
                  <li><strong>La Partage:</strong> on 0 you get half your even-money stake back. Edge 1.35%.</li>
                  <li><strong>En Prison:</strong> on 0 your stake is held for the next spin. If it wins, you get the stake back (no winnings); otherwise it&apos;s lost. Edge ≈ 1.39%.</li>
                  <li>They never apply to inside bets, dozens or columns, and are rare outside Europe.</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Three ideas to remember</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {[
                ["Independence", "Each spin is a fresh event. Streaks, 'hot' numbers and 'due' colours carry no information about the next spin."],
                ["House edge", "Payouts are set as if there were 36 pockets. The extra zero pocket(s) are where the casino's profit comes from."],
                ["Variance", "Short-term results swing wildly. Over many spins, your loss rate converges towards the house edge."],
              ].map(([t, b]) => (
                <div key={t} className="rounded-xl border border-border bg-surface-2/50 p-3">
                  <div className="font-display text-gold-strong">{t}</div>
                  <p className="mt-1 text-sm text-muted">{b}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
