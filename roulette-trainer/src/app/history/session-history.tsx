"use client";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PocketBadge } from "@/components/roulette/pocket-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Stat } from "@/components/ui/form";
import { sessionNet } from "@/lib/analytics/aggregate";
import { STRATEGY_INFO } from "@/lib/content/strategies";
import { useAppStore, type SessionRecord } from "@/store/app-store";
import { AXIS, GRID, SERIES, TOOLTIP_STYLE } from "@/lib/utils/chart-theme";
import { cn } from "@/lib/utils/cn";
import { fmtDuration, fmtMoney, fmtPct } from "@/lib/utils/format";

function SessionDetail({ s }: { s: SessionRecord }) {
  const data = [{ i: 0, balance: s.startBalance }, ...s.spins.map((sp, i) => ({ i: i + 1, balance: sp.balanceAfter }))];
  return (
    <div className="space-y-4 border-t border-border p-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Wagered" value={fmtMoney(s.wagered)} sub={`expected loss ${fmtMoney(s.theoreticalLoss)}`} />
        <Stat label="Return on wagers" value={s.wagered ? fmtPct(sessionNet(s) / s.wagered) : "—"} />
        <Stat label="Max drawdown" value={fmtMoney(s.maxDrawdown)} sub={`peak ${fmtMoney(s.peak)}`} />
        <Stat label="Spins won / lost" value={`${s.winningSpins} / ${s.losingSpins}`} sub={`biggest stake ${fmtMoney(s.biggestStake)}`} />
      </div>
      {data.length > 2 && (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="i" {...AXIS} minTickGap={24} />
            <YAxis {...AXIS} width={56} tickFormatter={(v: number) => fmtMoney(v, { decimals: 0 })} domain={["auto", "auto"]} />
            <Tooltip {...TOOLTIP_STYLE} labelFormatter={(v) => `After spin ${v}`} formatter={(v) => [fmtMoney(Number(v)), "Balance"]} />
            <ReferenceLine y={s.startBalance} stroke="#d6b25e" strokeDasharray="4 4" />
            <Line dataKey="balance" stroke={SERIES[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
      <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
        <table className="w-full text-sm tabular-nums">
          <thead className="sticky top-0 bg-surface-2 text-left text-xs uppercase text-muted"><tr><th className="px-3 py-1.5">#</th><th>Result</th><th>Staked</th><th>Net</th><th>Balance</th></tr></thead>
          <tbody>
            {[...s.spins].reverse().map((sp, idx) => (
              <tr key={idx} className="border-t border-border/50">
                <td className="px-3 py-1">{s.spins.length - idx}</td>
                <td><PocketBadge pocket={sp.pocket} size="sm" /></td>
                <td>{fmtMoney(sp.staked)}</td>
                <td className={sp.net > 0 ? "text-good" : sp.net < 0 ? "text-danger" : ""}>{fmtMoney(sp.net, { sign: true })}</td>
                <td>{fmtMoney(sp.balanceAfter)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SessionHistory() {
  const history = useAppStore((s) => s.history);
  const current = useAppStore((s) => s.current);
  const all = [...Object.values(current).filter((s): s is SessionRecord => !!s && s.spinCount > 0), ...history];
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <PageHeader eyebrow="Analytics" title="Session history" description="Every practice session and casino rehearsal, with spin-by-spin detail." />
      {all.length === 0 && <Card><CardContent className="pt-5 text-muted">No sessions yet.</CardContent></Card>}
      <div className="space-y-2">
        {all.map((s) => {
          const n = sessionNet(s);
          const isOpen = open === s.id;
          return (
            <Card key={s.id}>
              <button className="flex w-full flex-wrap items-center gap-3 p-4 text-left touch-manipulation" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
                <Badge variant={s.mode === "casino" ? "default" : "muted"}>{s.mode === "casino" ? "Casino" : "Practice"}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{new Date(s.startedAt).toLocaleString()} · {s.wheel === "european" ? "European" : "American"}</div>
                  <div className="text-xs text-muted">
                    {s.spinCount} spins · {fmtDuration((s.endedAt ?? s.spins.at(-1)?.at ?? s.startedAt) - s.startedAt)}
                    {s.strategy && ` · ${STRATEGY_INFO[s.strategy].name}`}
                    {s.endReason ? ` · ${s.endReason}` : !s.endedAt ? " · in progress" : ""}
                  </div>
                </div>
                <span className={cn("font-semibold tabular-nums", n > 0 ? "text-good" : n < 0 ? "text-danger" : "")}>{fmtMoney(n, { sign: true })}</span>
                <ChevronDown className={cn("size-5 text-muted transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && <SessionDetail s={s} />}
            </Card>
          );
        })}
      </div>
    </>
  );
}
