"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import type { BetSpec, PlacedBet } from "@/lib/roulette/bets";
import { addBet, maxForBet, round2, scaleBets, settle, spinPocket, totalStake, validateBets, type SpinSettlement } from "@/lib/roulette/engine";
import { betMath } from "@/lib/roulette/probability";
import { cryptoRng, type Rng } from "@/lib/roulette/rng";
import type { Pocket } from "@/lib/roulette/wheel";
import { useAppStore, useRules, type SessionMode } from "@/store/app-store";
import { useSound } from "./use-sound";

export type Phase = "betting" | "spinning" | "result";

let sharedRng: Rng | null = null;
const getRng = () => (sharedRng ??= cryptoRng());

export function useRouletteGame(mode: SessionMode, opts: { stakeCap?: number } = {}) {
  const stakeCap = opts.stakeCap ?? Infinity;
  const rules = useRules();
  const bankroll = useAppStore((s) => s.bankroll);
  const session = useAppStore((s) => s.current[mode]);
  const recordSpin = useAppStore((s) => s.recordSpin);
  const play = useSound();

  const balance = mode === "practice" ? bankroll : session?.balance ?? 0;
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [undoStack, setUndo] = useState<PlacedBet[][]>([]);
  const [lastBets, setLastBets] = useState<PlacedBet[]>([]);
  const [prison, setPrison] = useState<PlacedBet[]>([]);
  const [phase, setPhase] = useState<Phase>("betting");
  const [result, setResult] = useState<Pocket | null>(null);
  const [spinId, setSpinId] = useState(0);
  const [settlement, setSettlement] = useState<SpinSettlement | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [chip, setChip] = useState(5);
  const inFlight = useRef<{ bets: PlacedBet[]; prison: PlacedBet[]; pocket: Pocket; balance: number } | null>(null);

  // After a result, the table is clear until the player places the next bet.
  const activeBets = useMemo(() => (phase === "result" ? [] : bets), [phase, bets]);
  const stake = totalStake(activeBets);
  const available = round2(balance - stake);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice((m) => (m === msg ? null : m)), 2600);
  }, []);

  const commit = useCallback((next: PlacedBet[]) => {
    setUndo((u) => [...u.slice(-49), activeBets]);
    setBets(next);
    setPhase("betting");
    setSettlement(null);
  }, [activeBets]);

  const placeBet = useCallback((spec: BetSpec, amount = chip) => {
    if (phase === "spinning") return false;
    const existing = activeBets.find((b) => b.key === spec.key)?.amount ?? 0;
    const max = maxForBet(spec, rules);
    let amt = amount;
    if (existing + amt > max) amt = round2(max - existing);
    if (amt <= 0) { flash(`Table maximum for ${spec.label} is $${max}`); return false; }
    if (existing + amt < rules.minBet) { flash(`Table minimum is $${rules.minBet} per position`); return false; }
    if (totalStake(activeBets) + amt > balance + 1e-9) { flash("Not enough balance for that chip"); return false; }
    if (totalStake(activeBets) + amt > stakeCap + 1e-9) { flash(`Your plan allows at most $${round2(stakeCap)} at risk this spin`); return false; }
    if (amt < amount) flash(`Capped at the $${max} table maximum`);
    commit(addBet(activeBets, spec, amt));
    play("chip");
    return true;
  }, [phase, activeBets, chip, rules, balance, flash, play, commit, stakeCap]);

  const removeBet = useCallback((key: string) => {
    if (phase === "spinning") return;
    commit(activeBets.filter((b) => b.key !== key));
  }, [phase, activeBets, commit]);

  const undo = useCallback(() => {
    if (phase === "spinning" || !undoStack.length) return;
    setBets(undoStack[undoStack.length - 1]);
    setUndo((u) => u.slice(0, -1));
    setPhase("betting");
  }, [phase, undoStack]);

  const clear = useCallback(() => { if (phase !== "spinning" && activeBets.length) commit([]); }, [phase, activeBets, commit]);

  const repeat = useCallback(() => {
    if (phase === "spinning" || !lastBets.length) return;
    const issues = validateBets(lastBets, rules, Math.min(balance, stakeCap));
    if (issues.length) { flash(issues[0].message); return; }
    commit(lastBets.map((b) => ({ ...b })));
    play("chip");
  }, [phase, lastBets, rules, balance, flash, commit, play, stakeCap]);

  const double = useCallback(() => {
    if (phase === "spinning" || !activeBets.length) return;
    const next = scaleBets(activeBets, 2, rules, Math.min(balance, stakeCap));
    if (!next) { flash("Doubling would exceed the table limit, your balance or your plan"); return; }
    commit(next);
    play("chip");
  }, [phase, activeBets, rules, balance, flash, commit, play, stakeCap]);

  /** Start a spin. The engine draws the pocket; the wheel then animates to it. */
  const spin = useCallback((allowEmpty = false) => {
    if (phase === "spinning") return false;
    if (!activeBets.length && !allowEmpty && !prison.length) { flash("Place a bet first"); return false; }
    const issues = validateBets(activeBets, rules, balance);
    if (issues.length) { flash(issues[0].message); return false; }
    const pocket = spinPocket(rules.wheel, getRng());
    inFlight.current = { bets: activeBets, prison, pocket, balance };
    setBets(activeBets);
    setSettlement(null);
    setResult(pocket);
    setPhase("spinning");
    setSpinId((i) => i + 1);
    play("spin");
    return true;
  }, [phase, activeBets, prison, rules, balance, flash, play]);

  /** Called by the wheel when the ball has landed. */
  const onSettled = useCallback(() => {
    const f = inFlight.current;
    if (!f) return;
    inFlight.current = null;
    const s = settle(f.bets, f.pocket, rules, f.prison);
    const newBalance = round2(f.balance - s.staked + s.returned);
    const theo = f.bets.reduce((acc, b) => acc + b.amount * betMath(b, rules).houseEdge, 0);
    if (f.bets.length || f.prison.length) {
      recordSpin(mode, {
        pocket: f.pocket,
        staked: s.staked,
        returned: s.returned,
        net: s.net,
        balanceAfter: newBalance,
        at: Date.now(),
        bets: f.bets.map((b) => ({ key: b.key, kind: b.kind, amount: b.amount })),
      }, round2(theo));
    }
    setSettlement(s);
    setPrison(s.imprisoned);
    if (f.bets.length) setLastBets(f.bets);
    setUndo([]);
    setPhase("result");
    play("drop");
    if (f.bets.length) setTimeout(() => play(s.net > 0 ? "win" : "lose"), 250);
  }, [rules, mode, recordSpin, play]);

  const winningKeys = useMemo(() => settlement?.outcomes.filter((o) => o.status === "win").map((o) => o.bet.key) ?? [], [settlement]);

  const resetTable = useCallback(() => {
    setBets([]); setUndo([]); setPrison([]); setPhase("betting"); setSettlement(null);
  }, []);

  return {
    rules, balance, available, stake, activeBets,
    /** Bets shown on the layout: the live bets, or last spin's bets while showing a result. */
    shownBets: bets,
    lastBets, prison, phase, result, spinId, settlement, notice, chip, winningKeys, session,
    setChip, placeBet, removeBet, undo, clear, repeat, double, spin, onSettled, flash, resetTable,
    canUndo: undoStack.length > 0 && phase !== "spinning",
  };
}

export type RouletteGame = ReturnType<typeof useRouletteGame>;
