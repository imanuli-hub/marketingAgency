"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BetSpec, PlacedBet } from "@/lib/roulette/bets";
import { addBet, maxForBet, round2, scaleBets, settle, spinPocket, totalStake, validateBets, type SpinSettlement, type ValidationIssue } from "@/lib/roulette/engine";
import { betMath } from "@/lib/roulette/probability";
import { cryptoRng, type Rng } from "@/lib/roulette/rng";
import type { Pocket } from "@/lib/roulette/wheel";
import { useLocale, useT, type MessageKey } from "@/lib/i18n";
import { betLabel } from "@/lib/i18n/bet-labels";
import { fmtMoney } from "@/lib/utils/format";
import { useAppStore, useRules, type SessionMode, type SessionRecord } from "@/store/app-store";
import { useSound } from "./use-sound";

export type Phase = "betting" | "spinning" | "result";

let sharedRng: Rng | null = null;
const getRng = () => (sharedRng ??= cryptoRng());

export function useRouletteGame(mode: SessionMode, opts: { stakeCap?: number; afterSpin?: (session: SessionRecord | undefined) => void } = {}) {
  const stakeCap = opts.stakeCap ?? Infinity;
  const afterSpin = useRef(opts.afterSpin);
  useEffect(() => { afterSpin.current = opts.afterSpin; });
  const rules = useRules();
  const bankroll = useAppStore((s) => s.bankroll);
  const session = useAppStore((s) => s.current[mode]);
  const recordSpin = useAppStore((s) => s.recordSpin);
  const defaultChip = useAppStore((s) => s.settings.practiceBaseBet);
  const play = useSound();
  const t = useT();
  const locale = useLocale();

  const balance = mode === "practice" ? bankroll : session?.balance ?? 0;
  // En-prison bets survive reloads: they live on the persisted session record.
  const prison = useMemo(() => session?.prison ?? [], [session?.prison]);
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [undoStack, setUndo] = useState<PlacedBet[][]>([]);
  const [lastBets, setLastBets] = useState<PlacedBet[]>([]);
  const [phase, setPhase] = useState<Phase>("betting");
  const [result, setResult] = useState<Pocket | null>(null);
  const [spinId, setSpinId] = useState(0);
  const [settlement, setSettlement] = useState<SpinSettlement | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [chip, setChip] = useState(defaultChip);
  const inFlight = useRef<{ bets: PlacedBet[]; prison: PlacedBet[]; pocket: Pocket; balance: number; strategyRequired?: number } | null>(null);

  // After a result, the table is clear until the player places the next bet.
  const activeBets = useMemo(() => (phase === "result" ? [] : bets), [phase, bets]);
  const stake = totalStake(activeBets);
  const available = round2(balance - stake);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice((m) => (m === msg ? null : m)), 2600);
  }, []);

  /** Localized text for an engine validation issue. */
  const issueText = useCallback((issue: ValidationIssue, list: PlacedBet[]) => {
    const bet = list.find((b) => b.key === issue.key);
    const params: Record<string, string | number> = { ...issue.params };
    if (bet) params.label = betLabel(bet, locale);
    for (const k of ["limit", "total", "balance"]) if (typeof params[k] === "number") params[k] = fmtMoney(params[k] as number);
    return t(`val.${issue.code}` as MessageKey, params);
  }, [t, locale]);

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
    if (amt <= 0) { flash(t("game.tableMax", { label: betLabel(spec, locale), max: fmtMoney(max) })); return false; }
    if (existing + amt < rules.minBet) { flash(t("game.tableMin", { min: fmtMoney(rules.minBet) })); return false; }
    if (totalStake(activeBets) + amt > balance + 1e-9) { flash(t("game.noBalance")); return false; }
    if (totalStake(activeBets) + amt > stakeCap + 1e-9) { flash(t("game.planCap", { cap: fmtMoney(round2(stakeCap)) })); return false; }
    if (amt < amount) flash(t("game.capped", { max: fmtMoney(max) }));
    commit(addBet(activeBets, spec, amt));
    play("chip");
    return true;
  }, [phase, activeBets, chip, rules, balance, flash, play, commit, stakeCap, t, locale]);

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

  /** Replace the table with an exact set of bets (used by guided steps and strategy auto-bets). */
  const setTable = useCallback((next: PlacedBet[]) => {
    if (phase === "spinning") return false;
    const issues = validateBets(next, rules, Math.min(balance, stakeCap));
    if (issues.length) { flash(issueText(issues[0], next)); return false; }
    commit(next);
    play("chip");
    return true;
  }, [phase, rules, balance, stakeCap, flash, issueText, commit, play]);

  const repeat = useCallback(() => {
    if (phase === "spinning" || !lastBets.length) return;
    setTable(lastBets.map((b) => ({ ...b })));
  }, [phase, lastBets, setTable]);

  const double = useCallback(() => {
    if (phase === "spinning" || !activeBets.length) return;
    const next = scaleBets(activeBets, 2, rules, Math.min(balance, stakeCap));
    if (!next) { flash(t("game.noDouble")); return; }
    commit(next);
    play("chip");
  }, [phase, activeBets, rules, balance, flash, commit, play, stakeCap, t]);

  /** Start a spin. The engine draws the pocket; the wheel then animates to it. */
  const spin = useCallback((allowEmpty = false, meta: { strategyRequired?: number } = {}) => {
    if (phase === "spinning") return false;
    if (!activeBets.length && !allowEmpty && !prison.length) { flash(t("game.placeFirst")); return false; }
    const issues = validateBets(activeBets, rules, balance);
    if (issues.length) { flash(issueText(issues[0], activeBets)); return false; }
    const pocket = spinPocket(rules.wheel, getRng());
    inFlight.current = { bets: activeBets, prison, pocket, balance, strategyRequired: meta.strategyRequired };
    setBets(activeBets);
    setSettlement(null);
    setResult(pocket);
    setPhase("spinning");
    setSpinId((i) => i + 1);
    play("spin");
    return true;
  }, [phase, activeBets, prison, rules, balance, flash, play, t, issueText]);

  /** Place an exact set of bets and spin in one step (educational auto-progression). */
  const spinWith = useCallback((next: PlacedBet[], meta: { strategyRequired?: number } = {}) => {
    if (phase === "spinning") return false;
    const issues = validateBets(next, rules, Math.min(balance, stakeCap));
    if (issues.length) { flash(issueText(issues[0], next)); return false; }
    const pocket = spinPocket(rules.wheel, getRng());
    inFlight.current = { bets: next, prison, pocket, balance, strategyRequired: meta.strategyRequired };
    setUndo([]);
    setBets(next);
    setSettlement(null);
    setResult(pocket);
    setPhase("spinning");
    setSpinId((i) => i + 1);
    play("spin");
    return true;
  }, [phase, rules, balance, stakeCap, prison, flash, issueText, play]);

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
        bets: f.bets.map((b) => ({ key: b.key, kind: b.kind, amount: b.amount, won: b.numbers.includes(f.pocket) })),
        ...(f.strategyRequired !== undefined && f.bets.length ? { strategyRequired: f.strategyRequired } : {}),
      }, round2(theo), s.imprisoned);
    }
    setSettlement(s);
    if (f.bets.length) setLastBets(f.bets);
    setUndo([]);
    setPhase("result");
    play("drop");
    if (f.bets.length) setTimeout(() => play(s.net > 0 ? "win" : "lose"), 250);
    afterSpin.current?.(useAppStore.getState().current[mode]);
  }, [rules, mode, recordSpin, play]);

  const winningKeys = useMemo(() => settlement?.outcomes.filter((o) => o.status === "win").map((o) => o.bet.key) ?? [], [settlement]);

  const resetTable = useCallback(() => {
    setBets([]); setUndo([]); setPhase("betting"); setSettlement(null);
  }, []);

  return {
    mode, rules, balance, available, stake, activeBets,
    /** Bets shown on the layout: the live bets, or last spin's bets while showing a result. */
    shownBets: bets,
    lastBets, prison, phase, result, spinId, settlement, notice, chip, winningKeys, session,
    setChip, placeBet, removeBet, undo, clear, repeat, double, spin, spinWith, onSettled, flash, resetTable, setTable,
    canUndo: undoStack.length > 0 && phase !== "spinning",
  };
}

export type RouletteGame = ReturnType<typeof useRouletteGame>;
