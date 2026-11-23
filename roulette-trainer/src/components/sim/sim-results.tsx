"use client";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle } from "lucide-react";
import type { SimSummary } from "@/lib/roulette/simulator";
import { strategyInfo } from "@/lib/content/strategies.he";
import { Stat } from "@/components/ui/form";
import { useLocale, useT } from "@/lib/i18n";
import { AXIS, GAIN, GRID, LOSS, SERIES, TOOLTIP_STYLE } from "@/lib/utils/chart-theme";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/utils/format";

const ci = (x: [number, number]) => `${fmtPct(x[0], 1)}–${fmtPct(x[1], 1)}`;

export function SimKpis({ s }: { s: SimSummary }) {
  const t = useT();
  const start = s.config.bankroll;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      <Stat label={t("sim.meanEnd")} value={fmtMoney(s.meanEnd, { decimals: 2 })} sub={t("sim.vsStart", { d: fmtMoney(s.meanEnd - start, { sign: true, decimals: 2 }) })} tone={s.meanEnd >= start ? "good" : "danger"} />
      <Stat label={t("sim.medianEnd")} value={fmtMoney(s.medianEnd, { decimals: 0 })} sub={t("sim.p5p95", { lo: fmtMoney(s.p5, { decimals: 0 }), hi: fmtMoney(s.p95, { decimals: 0 }) })} />
      <Stat label={t("sim.ahead")} value={fmtPct(s.pAhead)} sub={t("sim.ci", { ci: ci(s.ci.pAhead) })} />
      <Stat label={t("sim.behind")} value={fmtPct(s.pBehind)} sub={t("sim.avgLossBehind", { amount: fmtMoney(s.meanLossWhenBehind, { decimals: 0 }) })} />
      <Stat label={t("sim.depleted")} value={fmtPct(s.pBust)} sub={s.config.stopLoss ? t("sim.stopLossHit", { p: fmtPct(s.pStopLoss) }) : t("sim.riskOfRuin")} tone={s.pBust > 0.2 ? "danger" : s.pBust > 0.05 ? "warn" : undefined} />
      <Stat label={t("sim.drawdown")} value={fmtMoney(s.meanMaxDrawdown, { decimals: 0 })} sub={t("sim.worst", { amount: fmtMoney(s.worstDrawdown, { decimals: 0 }) })} />
      <Stat label={t("sim.streak")} value={t("sim.spinsN", { n: s.longestLosingStreak })} sub={t("sim.avgPerSession", { n: s.meanLongestLosingStreak.toFixed(1) })} />
      <Stat label={t("sim.wagered")} value={fmtMoney(s.meanWagered, { decimals: 0 })} sub={t("sim.avgSpins", { n: fmtNum(s.meanSpins, 0) })} />
      <Stat label={t("sim.theoLoss")} value={fmtMoney(s.theoreticalLoss / s.sessions, { decimals: 2 })} sub={t("sim.theoLossSub")} />
      <Stat label={t("sim.actualLoss")} value={fmtMoney(s.actualLoss / s.sessions, { decimals: 2 })} sub={t("sim.meanCi", { lo: fmtMoney(-s.ci.meanProfit[1], { decimals: 2 }), hi: fmtMoney(-s.ci.meanProfit[0], { decimals: 2 }) })} tone={s.actualLoss > 0 ? "danger" : "good"} />
      <Stat label={t("sim.limitHits")} value={fmtPct(s.limitHitRate)} sub={t("sim.limitHitsSub")} />
      <Stat label={t("sim.winSpins")} value={fmtPct(s.spinWinRate)} sub={t("sim.freqNotProfit")} />
    </div>
  );
}

export function DistributionInsight({ s }: { s: SimSummary }) {
  const t = useT();
  if (!(s.pAhead > 0.5 && s.meanProfit < 0)) {
    return (
      <p className="rounded-xl border border-border bg-black/20 p-3 text-sm text-muted">
        {t("sim.insightPlain", { avg: fmtMoney(s.meanProfit, { sign: true, decimals: 2 }), n: fmtNum(s.sessions), rate: s.totalWagered ? fmtPct(s.actualLoss / s.totalWagered, 2) : "—", theo: s.totalWagered ? fmtPct(s.theoreticalLoss / s.totalWagered, 2) : "—" })}
      </p>
    );
  }
  return (
    <div className="flex gap-3 rounded-xl border border-warn/40 bg-warn/5 p-3 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
      <p>{t("sim.insightTail", { ahead: fmtPct(s.pAhead, 0), win: fmtMoney(s.meanProfitWhenAhead, { decimals: 0 }), behind: fmtPct(s.pBehind, 0), loss: fmtMoney(-s.meanLossWhenBehind, { decimals: 0 }), avg: fmtMoney(s.meanProfit, { sign: true, decimals: 2 }) })}</p>
    </div>
  );
}

export function ProfitHistogram({ s, height = 240 }: { s: SimSummary; height?: number }) {
  const t = useT();
  const data = s.histogram.map((b) => ({ mid: (b.from + b.to) / 2, range: `${fmtMoney(b.from, { decimals: 0 })} – ${fmtMoney(b.to, { decimals: 0 })}`, count: b.count, share: b.count / s.sessions }));
  return (
    <div dir="ltr">
      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: LOSS }} /> {t("sim.loss")}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: GAIN }} /> {t("sim.profit")}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="mid" {...AXIS} tickFormatter={(v: number) => fmtMoney(v, { decimals: 0 })} minTickGap={24} />
          <YAxis {...AXIS} width={44} tickFormatter={(v: number) => fmtNum(v)} />
          <Tooltip {...TOOLTIP_STYLE} labelFormatter={(_, p) => (p?.[0]?.payload as { range?: string })?.range ?? ""} formatter={(v, _n, p) => [t("sim.sessionsShare", { n: fmtNum(Number(v)), p: fmtPct((p.payload as { share: number }).share) }), t("sim.count")]} />
          <ReferenceLine x={data.reduce((best, d) => (Math.abs(d.mid) < Math.abs(best) ? d.mid : best), data[0]?.mid ?? 0)} stroke="#9aa89f" strokeDasharray="3 3" />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.mid < 0 ? LOSS : GAIN} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SamplePaths({ s, height = 240 }: { s: SimSummary; height?: number }) {
  const t = useT();
  const paths = s.paths.slice(0, 20);
  const len = Math.max(0, ...paths.map((p) => p.length));
  const step = Math.max(1, Math.ceil(s.config.spins / 400));
  const data = Array.from({ length: len }, (_, i) => {
    const row: Record<string, number> = { spin: i * step };
    paths.forEach((p, k) => { if (i < p.length) row[`s${k}`] = p[i]; });
    return row;
  });
  return (
    <div dir="ltr">
      <p className="mb-2 text-xs text-muted">{t("sim.pathsNote", { n: paths.length })}</p>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="spin" {...AXIS} tickFormatter={(v: number) => fmtNum(v)} minTickGap={30} />
          <YAxis {...AXIS} width={56} tickFormatter={(v: number) => fmtMoney(v, { decimals: 0 })} domain={["auto", "auto"]} />
          <Tooltip {...TOOLTIP_STYLE} labelFormatter={(v) => t("sim.spinN", { n: String(v) })} formatter={(v) => fmtMoney(Number(v), { decimals: 0 })} itemSorter={(i) => -Number(i.value)} />
          <ReferenceLine y={s.config.bankroll} stroke="#d6b25e" strokeDasharray="4 4" />
          {paths.map((_, k) => <Line key={k} dataKey={`s${k}`} name={`#${k + 1}`} stroke={GAIN} strokeOpacity={0.45} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CompareResults({ results, showTarget }: { results: SimSummary[]; showTarget?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const rows = results.map((r, i) => ({
    name: strategyInfo(r.config.strategy, locale).name.replace(/ \(.*\)$/, ""),
    color: SERIES[i % SERIES.length],
    pAhead: showTarget ? r.pStopWin : r.pAhead,
    meanProfit: r.meanProfit,
    r,
  }));
  const chartH = Math.max(160, rows.length * 36);
  const bars = (key: "pAhead" | "meanProfit", fmt: (v: number) => string) => (
    <ResponsiveContainer width="100%" height={chartH}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={6}>
        <CartesianGrid {...GRID} vertical horizontal={false} />
        <XAxis type="number" {...AXIS} tickFormatter={fmt} domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]} />
        <YAxis type="category" dataKey="name" {...AXIS} width={110} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => fmt(Number(v))} />
        <ReferenceLine x={0} stroke="#9aa89f" />
        <Bar dataKey={key} radius={4} name={key === "pAhead" ? t(showTarget ? "sim.pTarget" : "sim.ahead") : t("sim.avgResult")}>
          {rows.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        {rows.map((d) => <span key={d.name} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: d.color }} />{d.name}</span>)}
      </div>
      <div dir="ltr" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div><h4 className="mb-2 text-sm font-medium">{t(showTarget ? "sim.pTarget" : "sim.ahead")}</h4>{bars("pAhead", (v) => fmtPct(v, 0))}</div>
        <div><h4 className="mb-2 text-sm font-medium">{t("sim.avgResult")}</h4>{bars("meanProfit", (v) => fmtMoney(v, { decimals: 0 }))}</div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] whitespace-nowrap text-sm">
          <thead className="bg-surface-2 text-start text-xs uppercase tracking-wide text-muted">
            <tr>{[t("sim.col.strategy"), t(showTarget ? "sim.pTarget" : "sim.ahead"), t("sim.col.avg"), t("sim.col.median"), t("sim.col.drawdown"), t("sim.col.depleted"), t("sim.col.limit"), t("sim.col.wagered"), t("sim.col.theo")].map((h) => <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(({ name, color, r }) => (
              <tr key={name} className="border-t border-border/60 tabular-nums">
                <td className="px-3 py-2"><span className="me-2 inline-block size-2.5 rounded-sm" style={{ background: color }} />{name}</td>
                <td className="px-3 py-2">{fmtPct(showTarget ? r.pStopWin : r.pAhead)} <span className="text-xs text-muted">({ci(showTarget ? r.ci.pStopWin : r.ci.pAhead)})</span></td>
                <td className="px-3 py-2">{fmtMoney(r.meanProfit, { sign: true, decimals: 2 })}</td>
                <td className="px-3 py-2">{fmtMoney(r.medianEnd, { decimals: 0 })}</td>
                <td className="px-3 py-2">{fmtMoney(r.meanMaxDrawdown, { decimals: 0 })}</td>
                <td className="px-3 py-2">{fmtPct(showTarget ? r.pStopLoss + r.pBust : r.pBust)}</td>
                <td className="px-3 py-2">{fmtPct(r.limitHitRate)}</td>
                <td className="px-3 py-2">{fmtMoney(r.meanWagered, { decimals: 0 })}</td>
                <td className="px-3 py-2">{fmtMoney(r.theoreticalLoss / r.sessions, { decimals: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">{t("sim.compareNote")}</p>
    </div>
  );
}
