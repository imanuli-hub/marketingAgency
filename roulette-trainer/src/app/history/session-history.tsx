"use client";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PocketBadge } from "@/components/roulette/pocket-badge";
import { SessionReport, endReasonText } from "@/components/training/session-report";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { sessionNet } from "@/lib/analytics/aggregate";
import { strategyInfo } from "@/lib/content/strategies.he";
import { useLocale, useT, type MessageKey } from "@/lib/i18n";
import { useAppStore, type SessionRecord } from "@/store/app-store";
import { AXIS, GRID, SERIES, TOOLTIP_STYLE } from "@/lib/utils/chart-theme";
import { cn } from "@/lib/utils/cn";
import { fmtDateTime, fmtDuration, fmtMoney } from "@/lib/utils/format";

function SessionDetail({ s }: { s: SessionRecord }) {
  const t = useT();
  const data = [{ i: 0, balance: s.startBalance }, ...s.spins.map((sp, i) => ({ i: i + 1, balance: sp.balanceAfter }))];
  return (
    <div className="space-y-4 border-t border-border p-4">
      <SessionReport rec={s} />
      {data.length > 2 && (
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="i" {...AXIS} minTickGap={24} />
              <YAxis {...AXIS} width={56} tickFormatter={(v: number) => fmtMoney(v, { decimals: 0 })} domain={["auto", "auto"]} />
              <Tooltip {...TOOLTIP_STYLE} labelFormatter={(v) => t("history.afterSpin", { n: String(v) })} formatter={(v) => [fmtMoney(Number(v)), t("history.balance")]} />
              <ReferenceLine y={s.startBalance} stroke="#d6b25e" strokeDasharray="4 4" />
              <Line dataKey="balance" stroke={SERIES[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
        <table className="w-full text-sm tabular-nums">
          <thead className="sticky top-0 bg-surface-2 text-xs uppercase text-muted">
            <tr>{["#", t("history.result"), t("history.staked"), t("history.net"), t("history.balance")].map((h) => <th key={h} className="px-3 py-1.5 text-start">{h}</th>)}</tr>
          </thead>
          <tbody>
            {[...s.spins].reverse().map((sp, idx) => (
              <tr key={idx} className="border-t border-border/50">
                <td className="px-3 py-1">{s.spins.length - idx}</td>
                <td className="px-3"><PocketBadge pocket={sp.pocket} size="sm" /></td>
                <td className="px-3">{fmtMoney(sp.staked)}</td>
                <td className={cn("px-3", sp.net > 0 ? "text-good" : sp.net < 0 ? "text-danger" : "")}>{fmtMoney(sp.net, { sign: true })}</td>
                <td className="px-3">{fmtMoney(sp.balanceAfter)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SessionHistory() {
  const t = useT();
  const locale = useLocale();
  const history = useAppStore((s) => s.history);
  const current = useAppStore((s) => s.current);
  const all = [...Object.values(current).filter((s): s is SessionRecord => !!s && s.spinCount > 0), ...history];
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <PageHeader eyebrow={t("history.eyebrow")} title={t("history.title")} description={t("history.desc")} />
      {all.length === 0 && <Card><CardContent className="pt-5 text-muted">{t("dash.noSessions")}</CardContent></Card>}
      <div className="space-y-2">
        {all.map((s) => {
          const n = sessionNet(s);
          const isOpen = open === s.id;
          return (
            <Card key={s.id}>
              <button className="flex min-h-16 w-full flex-wrap items-center gap-3 p-4 text-start touch-manipulation" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
                <Badge variant={s.mode === "casino" ? "default" : "muted"}>{t(`mode.${s.mode}` as MessageKey)}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{fmtDateTime(s.startedAt)} · {t(s.wheel === "european" ? "wheel.european" : "wheel.american")}</div>
                  <div className="text-xs text-muted">
                    {t("practice.spins", { n: s.spinCount })} · {fmtDuration((s.endedAt ?? s.spins.at(-1)?.at ?? s.startedAt) - s.startedAt)}
                    {s.strategy && ` · ${strategyInfo(s.strategy, locale).name}`}
                    {s.endReason ? ` · ${endReasonText(t, s.endReason)}` : !s.endedAt ? ` · ${t("history.inProgress")}` : ""}
                  </div>
                </div>
                <span className={cn("font-semibold tabular-nums", n > 0 ? "text-good" : n < 0 ? "text-danger" : "")}>{fmtMoney(n, { sign: true })}</span>
                <ChevronDown className={cn("size-5 text-muted transition-transform", isOpen && "rotate-180")} aria-hidden />
              </button>
              {isOpen && <SessionDetail s={s} />}
            </Card>
          );
        })}
      </div>
    </>
  );
}
