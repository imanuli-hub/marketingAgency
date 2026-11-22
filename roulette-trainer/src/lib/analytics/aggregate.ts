import type { SessionRecord } from "@/store/app-store";

export interface Totals {
  sessions: number;
  spins: number;
  wagered: number;
  net: number;
  theoreticalLoss: number;
  returnOnWagers: number;
  winningSpinRate: number;
  winningSessionRate: number;
  avgStake: number;
  largestDrawdown: number;
  biggestStake: number;
}

export const sessionNet = (s: SessionRecord) => Math.round((s.balance - s.startBalance) * 100) / 100;

export function totals(sessions: SessionRecord[]): Totals {
  const played = sessions.filter((s) => s.spinCount > 0);
  const spins = played.reduce((a, s) => a + s.spinCount, 0);
  const wagered = played.reduce((a, s) => a + s.wagered, 0);
  const net = played.reduce((a, s) => a + sessionNet(s), 0);
  const winSpins = played.reduce((a, s) => a + s.winningSpins, 0);
  return {
    sessions: played.length,
    spins,
    wagered,
    net,
    theoreticalLoss: played.reduce((a, s) => a + s.theoreticalLoss, 0),
    returnOnWagers: wagered ? net / wagered : 0,
    winningSpinRate: spins ? winSpins / spins : 0,
    winningSessionRate: played.length ? played.filter((s) => sessionNet(s) > 0).length / played.length : 0,
    avgStake: spins ? wagered / spins : 0,
    largestDrawdown: Math.max(0, ...played.map((s) => s.maxDrawdown)),
    biggestStake: Math.max(0, ...played.map((s) => s.biggestStake)),
  };
}

/** Cumulative actual vs expected result across sessions, oldest first. */
export function cumulativeSeries(sessions: SessionRecord[]) {
  let actual = 0;
  let expected = 0;
  return [...sessions]
    .filter((s) => s.spinCount > 0)
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((s, i) => {
      actual += sessionNet(s);
      expected -= s.theoreticalLoss;
      return { n: i + 1, date: s.startedAt, actual: Math.round(actual * 100) / 100, expected: Math.round(expected * 100) / 100 };
    });
}

export function byStrategy(sessions: SessionRecord[]) {
  const groups = new Map<string, SessionRecord[]>();
  for (const s of sessions) {
    if (!s.spinCount) continue;
    const key = s.mode === "casino" ? "Casino rehearsal" : s.strategy ?? "Free play";
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  return [...groups.entries()].map(([key, list]) => ({ key, ...totals(list) }));
}
