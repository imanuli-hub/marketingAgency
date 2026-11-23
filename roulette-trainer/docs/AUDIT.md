# Audit & gap analysis (before the personalization release)

Baseline verified on the existing code before any changes: **77/77 unit tests pass, `tsc` clean, ESLint clean, production build succeeds.**

## Implemented correctly (kept as-is, reused)
- Engine: bet builders/validation, settlement for every bet on every pocket (EU + US), La Partage, En Prison, table limits, double/repeat scaling (`lib/roulette/*`, fully tested).
- Crypto RNG with rejection sampling; seeded sfc32 for reproducible simulations.
- Exact per-bet and per-layout EV/variance; losing-streak probability DP.
- Table geometry: chip anchors ↔ hit-testing round-trip for every bet; scroll-vs-tap guard.
- Wheel animation lands on the engine-drawn pocket (animation never decides results).
- Monte Carlo in a Web Worker, identical spin sequences across strategies.
- Deterministic coach with 3 modes, LLM adapter interface.
- Persisted store, dashboard, history, PWA manifest + service worker.

## Needs improvement
- **Currency is hard-coded to `$`** (format helper + hook messages). The profile is in euros.
- **Practice stop rules only alert**; they are not enforced and the session can continue (casino rehearsal does enforce).
- **14-day program** doesn't follow the requested structure (flat-betting practice days, comparison days, rehearsal days, final assessment).
- **Readiness score** has no payout/strategy/etiquette/discipline breakdown and no final report.
- **Coach**: no per-bet explanation list, no losing-streak explanation, no stop-rule implications, no post-session feedback. English only.
- **Strategy adherence** is checked by the coach but not recorded per spin, so it can't be reviewed afterwards.
- **Simulator**: no profile preset, no "reach target before stop" experiment, no uncertainty (confidence intervals).
- **Chip set** has no €2 chip, which the €2 base bet needs.
- **Session summaries** exist only for casino rehearsals and are thin.

## Missing
- Personal training profile (€100 / €2 / +€10 / −€20 / flat / 30–45 min) as a single editable source of truth.
- Guided (tutorial) practice mode with highlighted positions and payout prediction.
- Strategy practice mode: required vs actual stake, progression step, next-step bankroll need, table-limit failure, educational auto-progression.
- Hebrew/English localization with RTL.
- Final assessment (3 sessions + knowledge, payouts, strategy risk, discipline, etiquette) and a readiness report.
- Per-session educational review report.

## Potential bugs found
1. **En Prison state is not persisted.** A held stake is deducted at the spin, but if the page reloads before the next spin the prison is lost and the stake silently vanishes. *Fix: persist prison on the session record.*
2. **Validation messages are English strings built in the engine.** They can't be localized. *Fix: issue codes + params.*
3. Casino rehearsal had an unreachable "would breach limit" warning (the stake cap already blocks it). Cosmetic.
4. Strategy adherence in the coach assumes an even-money target (payout 1). Correct for the default practice target, but documented as a limitation for other targets.

No settlement, payout or accounting errors were found: every bet/pocket combination is covered by existing tests.

## Plan
1. Personalization: profile in settings (store migration v2), € currency, enforced stop rules (shared pure `checkStopRules`), prison persistence, €2 chip.
2. Guided training: new program content, guided tutorial page, numeric quiz questions, final assessment + readiness report.
3. Strategy practice: per-spin required stake, tracker panel, auto-progression; simulator profile preset, target-vs-stop experiment, Wilson CIs.
4. UX & localization: typed en/he dictionaries, RTL via logical CSS, LTR islands for the table/charts, language switcher.
5. Analytics: `buildSessionReview` + report UI after every session and in history.
6. Verification: unit tests for all new logic, typecheck, lint, build, Playwright desktop/iPhone in both languages, casino flow, reload persistence.
