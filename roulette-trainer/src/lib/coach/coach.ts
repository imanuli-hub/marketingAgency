import { betMath, layoutMath } from "@/lib/roulette/probability";
import { createStrategy } from "@/lib/roulette/strategies";
import { pocketColor, pocketCount } from "@/lib/roulette/wheel";
import type { CoachInput, CoachProvider, Insight } from "./types";

const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;
const money = (x: number) => `${x < 0 ? "−" : ""}${Math.abs(x).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/** Standard normal CDF (Abramowitz–Stegun 7.1.26). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

/** Normal approximation of being ahead after `spins` repetitions of a layout. */
export function pAheadAfter(evPerSpin: number, sdPerSpin: number, spins: number): number {
  if (sdPerSpin <= 0) return evPerSpin > 0 ? 1 : 0;
  return 1 - normalCdf((-evPerSpin * spins) / (sdPerSpin * Math.sqrt(spins)));
}

export function analyze(input: CoachInput): Insight[] {
  const { mode, rules, bets, balance, session } = input;
  const out: Insight[] = [];
  const n = pocketCount(rules.wheel);
  const stake = bets.reduce((s, b) => s + b.amount, 0);
  const spins = session?.spins ?? [];
  const sessionNet = session ? balance - session.startBalance : 0;

  // --- Responsible play checks come first ---------------------------------
  if (session?.stopLoss) {
    const used = -sessionNet / session.stopLoss;
    if (used >= 1) {
      out.push({ id: "stoploss-hit", tone: "danger", title: "Loss limit reached", body: `You are down ${money(-sessionNet)}, which meets your loss limit of ${money(session.stopLoss)}. Your plan says this session is over. Ending now is the single most valuable casino skill you can practise.` });
    } else if (used >= 0.75) {
      out.push({ id: "stoploss-near", tone: "warn", title: "Approaching your loss limit", body: `You have used ${pct(used, 0)} of your ${money(session.stopLoss)} loss limit. Only ${money(session.stopLoss + sessionNet)} remains before your plan says stop.` });
    } else if (stake > 0 && stake > session.stopLoss + sessionNet) {
      out.push({ id: "stoploss-bet", tone: "warn", title: "This bet could breach your limit", body: `Losing this ${money(stake)} spin would take you past your loss limit.` });
    }
  }
  if (session?.stopWin && sessionNet >= session.stopWin) {
    out.push({ id: "stopwin-hit", tone: "good", title: "Win goal reached", body: `You are up ${money(sessionNet)} — at or above your ${money(session.stopWin)} target. The house edge applies to every further spin, so a planned stop here locks in a good session.` });
  }
  if (session && input.breakReminderMins && input.now - session.startedAt > input.breakReminderMins * 60_000) {
    const mins = Math.floor((input.now - session.startedAt) / 60_000);
    out.push({ id: "break", tone: "info", title: `You've been playing for ${mins} minutes`, body: "A short break helps keep decisions deliberate. Real casinos are designed so you lose track of time — practise noticing it." });
  }

  // Chasing losses: stake raised right after a losing spin.
  if (spins.length >= 2 && stake > 0) {
    const last = spins[spins.length - 1];
    const base = spins.slice(0, Math.min(5, spins.length)).reduce((s, x) => s + x.staked, 0) / Math.min(5, spins.length);
    let raisesAfterLoss = 0;
    for (let i = 1; i < spins.length; i++) if (spins[i - 1].net < 0 && spins[i].staked > spins[i - 1].staked * 1.4) raisesAfterLoss++;
    const strategyIsProgression = input.strategy && ["martingale", "dalembert", "fibonacci", "labouchere"].includes(input.strategy.id);
    if (last.net < 0 && stake >= last.staked * 1.5 && !strategyIsProgression) {
      out.push({ id: "chasing", tone: "warn", title: "Raising stakes after a loss", body: `Your stake went from ${money(last.staked)} to ${money(stake)} right after losing. Bigger bets don't make a win more likely; they only increase how much is at risk. If this isn't part of a plan you set before playing, it's chasing.` });
    } else if (raisesAfterLoss >= 3 && stake > base * 2) {
      out.push({ id: "chasing-pattern", tone: "warn", title: "Pattern: stakes climb after losses", body: `${raisesAfterLoss} times this session you raised your stake after a loss, and you're now betting ${(stake / base).toFixed(1)}× your opening stake.` });
    }
  }

  // Gambler's fallacy: betting a colour after a streak.
  const recent = spins.slice(-6).map((s) => pocketColor(s.pocket));
  if (recent.length >= 4 && stake > 0) {
    const lastC = recent[recent.length - 1];
    let streak = 0;
    for (let i = recent.length - 1; i >= 0 && recent[i] === lastC; i--) streak++;
    const opposite = lastC === "red" ? "black" : lastC === "black" ? "red" : null;
    if (streak >= 4 && opposite && bets.some((b) => b.kind === opposite)) {
      out.push({ id: "fallacy", tone: "info", title: `${streak} ${lastC}s in a row — ${opposite} is not "due"`, body: `The wheel has no memory. ${opposite[0].toUpperCase() + opposite.slice(1)} still wins ${pct(18 / n)} of the time on this spin, exactly as it did before the streak.` });
    }
  }

  // --- The current bet ------------------------------------------------------
  if (!bets.length) {
    if (mode === "beginner") {
      out.push({ id: "how", tone: "info", title: "Place a bet", body: "Pick a chip value, then tap the table. Tap the middle of a number for a straight-up bet, its edge for a split, a corner where four numbers meet, or the outside boxes (Red, Odd, 1st 12…) for simpler bets that win more often but pay less." });
    } else {
      out.push({ id: "idle", tone: "info", title: "No bets on the table", body: "Every layout you can build has the same house edge per unit wagered on this wheel. What you choose changes how often you win and by how much — not the long-run cost." });
    }
  } else {
    const lm = layoutMath(bets, rules);
    const exposure = balance > 0 ? stake / (balance + 0) : 1;
    const evPct = -lm.evPct;

    if (mode === "beginner") {
      const parts = bets.slice(0, 3).map((b) => `${b.label} pays ${b.payout} to 1`);
      out.push({ id: "bet", tone: "info", title: `Betting ${money(stake)}`, body: `${parts.join("; ")}${bets.length > 3 ? "; …" : ""}. At least one of your bets wins on ${pct(lm.pAnyWin, 0)} of spins. Best result ${money(lm.bestCase)}, worst ${money(lm.worstCase)}.` });
    } else {
      out.push({ id: "bet", tone: "info", title: `${money(stake)} at risk · ${pct(lm.pProfit, 1)} chance to profit`, body: `P(any bet wins) ${pct(lm.pAnyWin)}, P(net profit) ${pct(lm.pProfit)}, P(net loss) ${pct(lm.pLoss)}. Range: ${money(lm.worstCase)} to +${money(lm.bestCase)}. Expected result ${money(lm.ev)} (house edge ${pct(evPct, 2)}).` });
    }

    if (exposure > 0.25) {
      out.push({ id: "exposure", tone: "danger", title: `${pct(exposure, 0)} of your bankroll on one spin`, body: "A single spin can wipe out a large share of your money. Many players keep each spin to 1–5% of their session budget so the budget lasts long enough to enjoy." });
    } else if (exposure > 0.1) {
      out.push({ id: "exposure", tone: "warn", title: `${pct(exposure, 0)} of your bankroll on one spin`, body: "That's a large share per spin. At 1–5% per spin your budget survives normal losing runs." });
    } else if (mode !== "beginner") {
      out.push({ id: "exposure", tone: "good", title: `Exposure ${pct(exposure, 1)} of bankroll`, body: "A sustainable stake size relative to your bankroll." });
    }

    if (lm.coverage >= 0.65 && bets.length >= 3) {
      out.push({ id: "coverage", tone: "info", title: `Covering ${pct(lm.coverage, 0)} of the wheel`, body: "Covering most numbers means frequent small wins — and occasional larger losses. The expected cost per unit wagered is unchanged; you've only reshaped the outcomes." });
    }

    if (bets.some((b) => b.kind === "basket")) {
      out.push({ id: "basket", tone: "warn", title: "The basket is the worst bet on the table", body: `0-00-1-2-3 pays 6:1 for 5 numbers: a ${pct(betMath(bets.find((b) => b.kind === "basket")!, rules).houseEdge, 2)} house edge versus 5.26% for every other American bet.` });
    }
    if (rules.wheel === "american" && mode !== "beginner") {
      out.push({ id: "wheel", tone: "info", title: "Double-zero wheel", body: "The extra 00 pocket almost doubles the house edge (5.26% vs 2.70%). At a real casino, prefer a single-zero table if one is available at your stake level." });
    }
    if (rules.wheel === "european" && rules.evenMoneyRule !== "none" && mode !== "beginner" && bets.some((b) => ["red", "black", "odd", "even", "low", "high"].includes(b.kind))) {
      out.push({ id: "partage", tone: "good", title: `${rules.evenMoneyRule === "laPartage" ? "La Partage" : "En Prison"} protects your even-money bets`, body: `On zero you lose only about half of an even-money bet, cutting its house edge to ${pct(betMath({ kind: "red", numbers: Array(18).fill(1), payout: 1 }, rules).houseEdge, 2)}. Other bets keep the 2.70% edge.` });
    }

    if (mode === "advanced") {
      const N = 100;
      const p = pAheadAfter(lm.ev, lm.sd, N);
      out.push({ id: "longrun", tone: "info", title: `Repeat this ${N} times: expect ${money(lm.ev * N)}`, body: `Per spin: EV ${money(lm.ev)}, σ ${money(lm.sd)}. Over ${N} spins: mean ${money(lm.ev * N)}, ±1σ ≈ ${money(lm.sd * Math.sqrt(N))}. Normal approx. P(ahead) ≈ ${pct(p, 0)}. Variance dominates short sessions; the edge dominates long ones.` });
      if (balance > 0) {
        const spinsToRuinExpected = -lm.ev > 0 ? balance / -lm.ev : Infinity;
        out.push({ id: "ruin", tone: "info", title: "Bankroll horizon", body: `At this layout the expected loss would consume your ${money(balance)} bankroll in about ${Math.round(spinsToRuinExpected).toLocaleString()} spins on average — and variance means it can happen far sooner. Use the Simulator for a full risk-of-ruin estimate.` });
      }
    } else if (mode === "intermediate") {
      out.push({ id: "edge", tone: "info", title: `Expected cost: ${money(-lm.ev)} per spin`, body: `${money(stake)} × ${pct(evPct, 2)} house edge. At ~35 spins an hour at a live table that's about ${money(-lm.ev * 35)} per hour on average — budget for it like the price of entertainment.` });
    }
  }

  // --- Strategy adherence ------------------------------------------------
  if (input.strategy && stake > 0) {
    const s = createStrategy(input.strategy.id, { baseBet: input.strategy.baseBet });
    for (const sp of spins) s.record(sp.net, { bankroll: sp.balanceAfter, minBet: rules.minBet, payout: 1 });
    const expected = s.nextStake({ bankroll: balance, minBet: rules.minBet, payout: 1 });
    const ok = Math.abs(expected - stake) < 0.01;
    out.push({ id: "strategy", tone: ok ? "good" : "warn", title: ok ? "Following your strategy" : "Off your strategy", body: ok ? `Your ${money(stake)} stake matches the system's next bet (${s.state()}).` : `Your system calls for ${money(expected)} next (${s.state()}), but you have ${money(stake)} on the table.` });
  }

  return out;
}

export const deterministicCoach: CoachProvider = { analyze };
