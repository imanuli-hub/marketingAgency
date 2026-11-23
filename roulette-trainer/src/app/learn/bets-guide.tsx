"use client";
import { useMemo, useState } from "react";
import { BettingTable } from "@/components/roulette/betting-table";
import { useTableOrientation } from "@/components/roulette/game-surface";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale, useT, type MessageKey } from "@/lib/i18n";
import { betLabel } from "@/lib/i18n/bet-labels";
import * as B from "@/lib/roulette/bets";
import type { BetSpec } from "@/lib/roulette/bets";
import { DEFAULT_RULES, type EvenMoneyRule, type TableRules } from "@/lib/roulette/engine";
import { betMath } from "@/lib/roulette/probability";
import { DOUBLE_ZERO, type WheelType } from "@/lib/roulette/wheel";
import { cn } from "@/lib/utils/cn";
import { fmtMoney, fmtPct } from "@/lib/utils/format";

interface BetType { id: string; inside: boolean; example: (w: WheelType) => BetSpec; wheels?: WheelType[] }

const BET_TYPES: BetType[] = [
  { id: "straight", inside: true, example: () => B.straight(17) },
  { id: "split", inside: true, example: () => B.split(17, 20) },
  { id: "street", inside: true, example: () => B.street(16) },
  { id: "corner", inside: true, example: () => B.corner(17) },
  { id: "sixLine", inside: true, example: () => B.sixLine(16) },
  { id: "trio", inside: true, example: (w) => B.trio([0, 1, 2], w) },
  { id: "firstFour", inside: true, example: () => B.firstFour(), wheels: ["european"] },
  { id: "basket", inside: true, example: () => B.basket(), wheels: ["american"] },
  { id: "dozen", inside: false, example: () => B.dozen(2) },
  { id: "column", inside: false, example: () => B.column(2) },
  { id: "red", inside: false, example: () => B.red() },
  { id: "odd", inside: false, example: () => B.odd() },
  { id: "low", inside: false, example: () => B.low() },
];

function MathRow({ spec, rules, stake = 2 }: { spec: BetSpec; rules: TableRules; stake?: number }) {
  const t = useT();
  const m = betMath(spec, rules);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Stat label={t("learn.payout")} value={`${spec.payout} : 1`} sub={t("learn.payoutSub", { stake: fmtMoney(stake), win: fmtMoney(stake * spec.payout) })} tone="gold" />
      <Stat label={t("learn.returned")} value={fmtMoney(stake * (spec.payout + 1))} sub={t("learn.returnedSub")} />
      <Stat label={t("learn.chance")} value={fmtPct(m.pWin, 2)} sub={t("learn.chanceSub", { k: spec.numbers.length, n: rules.wheel === "european" ? 37 : 38 })} />
      <Stat label={t("learn.trueOdds")} value={m.trueOdds.replace("to", ":")} sub={t("learn.trueOddsSub", { payout: spec.payout })} />
      <Stat label={t("learn.ev", { stake: fmtMoney(stake) })} value={fmtMoney(m.ev * stake, { decimals: 3 })} sub={t("learn.evSub")} tone="danger" />
      <Stat label={t("learn.edge")} value={fmtPct(m.houseEdge, 2)} sub={t("learn.sd", { sd: m.sd.toFixed(2) })} />
    </div>
  );
}

export function BetsGuide() {
  const t = useT();
  const locale = useLocale();
  const [wheel, setWheel] = useState<WheelType>("european");
  const [rule, setRule] = useState<EvenMoneyRule>("none");
  const rules: TableRules = { ...DEFAULT_RULES, wheel, evenMoneyRule: wheel === "european" ? rule : "none" };
  const types = BET_TYPES.filter((x) => !x.wheels || x.wheels.includes(wheel));
  const [typeId, setTypeId] = useState("straight");
  const [explored, setExplored] = useState<BetSpec | null>(null);
  const orientation = useTableOrientation();
  const type = types.find((x) => x.id === typeId) ?? types[0];
  const spec = explored ?? type.example(wheel);

  const tableRows = useMemo(() => {
    const kinds: [MessageKey, BetSpec, BetSpec][] = [
      ["learn.row.straight", B.straight(17), B.straight(17, "american")],
      ["learn.row.split", B.split(17, 20), B.split(17, 20)],
      ["learn.row.street", B.street(16), B.street(16)],
      ["learn.row.corner", B.corner(17), B.corner(17)],
      ["learn.row.four", B.firstFour(), B.basket()],
      ["learn.row.sixLine", B.sixLine(16), B.sixLine(16)],
      ["learn.row.dozen", B.dozen(1), B.dozen(1)],
      ["learn.row.even", B.red(), B.red()],
    ];
    const eu: TableRules = { ...DEFAULT_RULES, wheel: "european", evenMoneyRule: "none" };
    const us: TableRules = { ...DEFAULT_RULES, wheel: "american", evenMoneyRule: "none" };
    return kinds.map(([name, e, a]) => ({ name, payout: e.kind === "firstFour" ? "8:1 / 6:1" : `${e.payout}:1`, eu: betMath(e, eu), us: betMath(a, us) }));
  }, []);

  return (
    <>
      <PageHeader eyebrow={t("learn.eyebrow")} title={t("learn.title")} description={t("learn.desc")} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tabs value={wheel} onValueChange={(v) => { setWheel(v as WheelType); setExplored(null); }}>
          <TabsList>
            <TabsTrigger value="european">{t("wheel.european")}</TabsTrigger>
            <TabsTrigger value="american">{t("wheel.american")}</TabsTrigger>
          </TabsList>
        </Tabs>
        {wheel === "european" && (
          <Tabs value={rule} onValueChange={(v) => setRule(v as EvenMoneyRule)}>
            <TabsList>
              <TabsTrigger value="none">{t("rule.none")}</TabsTrigger>
              <TabsTrigger value="laPartage">La Partage</TabsTrigger>
              <TabsTrigger value="enPrison">En Prison</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="h-fit min-w-0">
          <CardContent className="pt-4">
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible [scrollbar-width:none]">
              {types.map((x) => (
                <button key={x.id} onClick={() => { setTypeId(x.id); setExplored(null); }}
                  className={cn("flex min-h-10 shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-2 text-start text-sm touch-manipulation", x.id === type.id && !explored ? "bg-gold/15 text-gold-strong" : "text-muted hover:bg-white/5 hover:text-foreground")}>
                  <span>{t(`learnBet.${x.id}` as MessageKey)}</span>
                  <Badge variant={x.inside ? "info" : "muted"}>{x.example(wheel).payout}:1</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{explored ? betLabel(explored, locale) : t(`learnBet.${type.id}` as MessageKey)}</CardTitle>
                <Badge variant={B.INSIDE_KINDS.has(spec.kind) ? "info" : "muted"}>{t(B.INSIDE_KINDS.has(spec.kind) ? "learn.inside" : "learn.outside")}</Badge>
                {explored && <button className="min-h-8 text-xs text-gold underline" onClick={() => setExplored(null)}>{t("learn.backToExample")}</button>}
              </div>
              <CardDescription>
                {explored
                  ? t("learn.covers", { numbers: spec.numbers.map((n) => (n === DOUBLE_ZERO ? "00" : n)).join(", ") })
                  : `${t(`learnBet.${type.id}.where` as MessageKey)} ${t("learn.example", { label: betLabel(spec, locale) })}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BettingTable wheel={wheel} orientation={orientation} bets={[B.place(spec, 2)]} highlight={spec.numbers} onPlace={setExplored}
                className={orientation === "vertical" ? "mx-auto max-w-[380px]" : undefined} ariaLabel={t("learn.demoTable")} />
              <MathRow spec={spec} rules={rules} />
              {B.isEvenMoney(spec.kind) && rules.evenMoneyRule !== "none" && (
                <p className="rounded-xl bg-good/10 p-3 text-sm text-good">{t(rules.evenMoneyRule === "laPartage" ? "learn.partageNote" : "learn.prisonNote")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("learn.tableTitle")}</CardTitle><CardDescription>{t("learn.tableDesc")}</CardDescription></CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[560px] text-sm tabular-nums">
                  <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                    <tr>{[t("learn.col.bet"), t("learn.col.pays"), t("learn.col.pEu"), t("learn.col.evEu"), t("learn.col.pUs"), t("learn.col.evUs")].map((h) => <th key={h} className="px-3 py-2 text-start">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {tableRows.map((r) => (
                      <tr key={r.name} className="border-t border-border/60">
                        <td className="px-3 py-2">{t(r.name)}</td>
                        <td className="px-3 py-2 text-gold-strong" dir="ltr">{r.payout}</td>
                        <td className="px-3 py-2">{fmtPct(r.eu.pWin, 2)}</td>
                        <td className="px-3 py-2">{fmtMoney(-r.eu.houseEdge, { decimals: 4 })}</td>
                        <td className="px-3 py-2">{fmtPct(r.us.pWin, 2)}</td>
                        <td className={cn("px-3 py-2", r.us.houseEdge > 0.06 && "text-danger")}>{fmtMoney(-r.us.houseEdge, { decimals: 4 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-muted">{t("learn.pattern")}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t("learn.euVsUs")}</CardTitle></CardHeader>
              <CardContent className="prose-casino text-sm">
                <ul>
                  <li>{t("learn.eu1")}</li>
                  <li>{t("learn.us1")}</li>
                  <li>{t("learn.hourly", { eu: fmtMoney(2 * 35 / 37, { decimals: 2 }), us: fmtMoney(2 * 35 * 2 / 38, { decimals: 2 }) })}</li>
                  <li>{t("learn.basket")}</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>La Partage & En Prison</CardTitle></CardHeader>
              <CardContent className="prose-casino text-sm">
                <p>{t("learn.rulesIntro")}</p>
                <ul><li>{t("learn.partage")}</li><li>{t("learn.prison")}</li><li>{t("learn.rulesScope")}</li></ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>{t("learn.ideas")}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {(["independence", "edge", "variance"] as const).map((k) => (
                <div key={k} className="rounded-xl border border-border bg-surface-2/50 p-3">
                  <div className="font-display text-gold-strong">{t(`learn.idea.${k}` as MessageKey)}</div>
                  <p className="mt-1 text-sm text-muted">{t(`learn.idea.${k}.body` as MessageKey)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
