"use client";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle } from "lucide-react";
import type { SimSummary } from "@/lib/roulette/simulator";
import { STRATEGY_INFO } from "@/lib/content/strategies";
import { Stat } from "@/components/ui/form";
import { AXIS, GAIN, GRID, LOSS, SERIES, TOOLTIP_STYLE } from "@/lib/utils/chart-theme";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/utils/format";

export function SimKpis({ s }: { s: SimSummary }) {
  const start = s.config.bankroll;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      <Stat label="Average ending bankroll" value={fmtMoney(s.meanEnd, { decimals: 0 })} sub={`${fmtMoney(s.meanEnd - start, { sign: true, decimals: 0 })} vs start`} tone={s.meanEnd >= start ? "good" : "danger"} />
      <Stat label="Median ending bankroll" value={fmtMoney(s.medianEnd, { decimals: 0 })} sub={`5th–95th: ${fmtMoney(s.p5, { decimals: 0 })} – ${fmtMoney(s.p95, { decimals: 0 })}`} />
      <Stat label="Finished ahead" value={fmtPct(s.pAhead)} sub={`avg win when ahead ${fmtMoney(s.meanProfitWhenAhead, { decimals: 0 })}`} />
      <Stat label="Finished behind" value={fmtPct(s.pBehind)} sub={`avg loss when behind ${fmtMoney(s.meanLossWhenBehind, { decimals: 0 })}`} />
      <Stat label="Bankroll depleted" value={fmtPct(s.pBust)} sub={s.config.stopLoss ? `stop-loss hit ${fmtPct(s.pStopLoss)}` : "risk of ruin"} tone={s.pBust > 0.2 ? "danger" : s.pBust > 0.05 ? "warn" : undefined} />
      <Stat label="Max drawdown" value={fmtMoney(s.meanMaxDrawdown, { decimals: 0 })} sub={`average · worst ${fmtMoney(s.worstDrawdown, { decimals: 0 })}`} />
      <Stat label="Longest losing streak" value={`${s.longestLosingStreak} spins`} sub={`avg per session ${s.meanLongestLosingStreak.toFixed(1)}`} />
      <Stat label="Avg wagered / session" value={fmtMoney(s.meanWagered, { decimals: 0 })} sub={`${fmtNum(s.meanSpins, 0)} spins avg`} />
      <Stat label="Expected theoretical loss" value={fmtMoney(s.theoreticalLoss / s.sessions, { decimals: 2 })} sub="per session (wagered × edge)" />
      <Stat label="Actual simulated loss" value={fmtMoney(s.actualLoss / s.sessions, { decimals: 2 })} sub="per session" tone={s.actualLoss > 0 ? "danger" : "good"} />
      <Stat label="Table-limit hits" value={fmtPct(s.limitHitRate)} sub="sessions where progression was capped" />
      <Stat label="Winning spins" value={fmtPct(s.spinWinRate)} sub="frequency ≠ profitability" />
    </div>
  );
}

export function DistributionInsight({ s }: { s: SimSummary }) {
  if (!(s.pAhead > 0.5 && s.meanProfit < 0)) {
    return (
      <p className="rounded-xl border border-border bg-black/20 p-3 text-sm text-muted">
        Average result {fmtMoney(s.meanProfit, { sign: true })} per session. Across {fmtNum(s.sessions)} sessions the simulated loss rate was {s.totalWagered ? fmtPct(s.actualLoss / s.totalWagered, 2) : "—"} of total wagered, vs a theoretical {s.totalWagered ? fmtPct(s.theoreticalLoss / s.totalWagered, 2) : "—"}.
      </p>
    );
  }
  return (
    <div className="flex gap-3 rounded-xl border border-warn/40 bg-warn/5 p-3 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
      <p>
        <strong>Most sessions won, yet the average lost.</strong> {fmtPct(s.pAhead, 0)} of sessions finished ahead by an average of {fmtMoney(s.meanProfitWhenAhead, { decimals: 0 })},
        but the {fmtPct(s.pBehind, 0)} that lost gave back {fmtMoney(-s.meanLossWhenBehind, { decimals: 0 })} on average. Net: {fmtMoney(s.meanProfit, { sign: true })} per session. A high chance of a small win can coexist with a risk of a large loss.
      </p>
    </div>
  );
}

export function ProfitHistogram({ s, height = 240 }: { s: SimSummary; height?: number }) {
  const data = s.histogram.map((b) => ({ mid: (b.from + b.to) / 2, range: `${fmtMoney(b.from, { decimals: 0 })} to ${fmtMoney(b.to, { decimals: 0 })}`, count: b.count, share: b.count / s.sessions }));
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: LOSS }} /> Loss</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: GAIN }} /> Profit</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="mid" {...AXIS} tickFormatter={(v: number) => fmtMoney(v, { decimals: 0 })} minTickGap={24} />
          <YAxis {...AXIS} width={44} tickFormatter={(v: number) => fmtNum(v)} />
          <Tooltip {...TOOLTIP_STYLE} labelFormatter={(_, p) => (p?.[0]?.payload as { range?: string })?.range ?? ""} formatter={(v, _n, p) => [`${fmtNum(Number(v))} sessions (${fmtPct((p.payload as { share: number }).share)})`, "Count"]} />
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
  const paths = s.paths.slice(0, 20);
  const len = Math.max(0, ...paths.map((p) => p.length));
  const step = Math.max(1, Math.ceil(s.config.spins / 400));
  const data = Array.from({ length: len }, (_, i) => {
    const row: Record<string, number> = { spin: i * step };
    paths.forEach((p, k) => { if (i < p.length) row[`s${k}`] = p[i]; });
    return row;
  });
  return (
    <div>
      <p className="mb-2 text-xs text-muted">Bankroll over time for {paths.length} sample sessions. Dashed line = starting bankroll.</p>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="spin" {...AXIS} tickFormatter={(v: number) => fmtNum(v)} minTickGap={30} />
          <YAxis {...AXIS} width={56} tickFormatter={(v: number) => fmtMoney(v, { decimals: 0 })} domain={["auto", "auto"]} />
          <Tooltip {...TOOLTIP_STYLE} labelFormatter={(v) => `Spin ${v}`} formatter={(v) => fmtMoney(Number(v), { decimals: 0 })} itemSorter={(i) => -Number(i.value)} />
          <ReferenceLine y={s.config.bankroll} stroke="#d6b25e" strokeDasharray="4 4" />
          {paths.map((_, k) => <Line key={k} dataKey={`s${k}`} name={`Session ${k + 1}`} stroke={GAIN} strokeOpacity={0.45} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CompareResults({ results }: { results: SimSummary[] }) {
  const rows = results.map((r, i) => ({
    name: STRATEGY_INFO[r.config.strategy].name.replace(/ \(.*\)$/, ""),
    color: SERIES[i % SERIES.length],
    pAhead: r.pAhead,
    meanProfit: r.meanProfit,
    p5: r.p5 - r.config.bankroll,
    pBust: r.pBust,
    r,
  }));
  const chartH = Math.max(160, rows.length * 34);
  const legend = (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
      {rows.map((d) => <span key={d.name} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: d.color }} />{d.name}</span>)}
    </div>
  );
  const bars = (key: "pAhead" | "meanProfit", fmt: (v: number) => string) => (
    <ResponsiveContainer width="100%" height={chartH}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={6}>
        <CartesianGrid {...GRID} vertical horizontal={false} />
        <XAxis type="number" {...AXIS} tickFormatter={fmt} domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]} />
        <YAxis type="category" dataKey="name" {...AXIS} width={110} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => fmt(Number(v))} />
        <ReferenceLine x={0} stroke="#9aa89f" />
        <Bar dataKey={key} radius={4} name={key === "pAhead" ? "Finished ahead" : "Average result"}>
          {rows.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
  return (
    <div className="space-y-5">
      {legend}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        <div><h4 className="mb-2 text-sm font-medium">Probability of finishing ahead</h4>{bars("pAhead", (v) => fmtPct(v, 0))}</div>
        <div><h4 className="mb-2 text-sm font-medium">Average result per session</h4>{bars("meanProfit", (v) => fmtMoney(v, { decimals: 0 }))}</div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] whitespace-nowrap text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
            <tr>{["Strategy", "Ahead", "Avg result", "Median end", "Worst 5%", "Depleted", "Avg wagered", "Loss / wagered"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(({ name, color, r }) => (
              <tr key={name} className="border-t border-border/60 tabular-nums">
                <td className="px-3 py-2"><span className="mr-2 inline-block size-2.5 rounded-sm" style={{ background: color }} />{name}</td>
                <td className="px-3 py-2">{fmtPct(r.pAhead)}</td>
                <td className="px-3 py-2">{fmtMoney(r.meanProfit, { sign: true })}</td>
                <td className="px-3 py-2">{fmtMoney(r.medianEnd, { decimals: 0 })}</td>
                <td className="px-3 py-2">{fmtMoney(r.p5, { decimals: 0 })}</td>
                <td className="px-3 py-2">{fmtPct(r.pBust)}</td>
                <td className="px-3 py-2">{fmtMoney(r.meanWagered, { decimals: 0 })}</td>
                <td className="px-3 py-2">{r.totalWagered ? fmtPct(r.actualLoss / r.totalWagered, 2) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">All strategies were run against identical spin sequences (same seed), so differences come only from staking decisions. Loss per unit wagered clusters around the house edge for every system.</p>
    </div>
  );
}
