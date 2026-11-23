# Roulette Academy — Personal Roulette Training Simulator

A mobile-first roulette **training** academy in Hebrew and English: learn the rules, understand the real maths, practise with a personal profile, compare betting systems with Monte Carlo simulation, and rehearse a casino visit with enforced stopping rules. **Virtual money only. No system beats the house edge, and the app never claims otherwise.**

## Run it

```bash
cd roulette-trainer
npm install
npm run dev                    # http://localhost:3000
npm test                       # unit tests (vitest)
npm run typecheck && npm run lint
npm run build && npm start     # production build (enables offline support)
```

### Install on iPhone
1. On your computer run `npm run build && npm start -- -H 0.0.0.0` (or `npm run dev -- -H 0.0.0.0`).
2. On the iPhone (same Wi-Fi), open `http://<computer-ip>:3000` in **Safari**.
3. Tap **Share → Add to Home Screen**. The app opens full-screen like a native app; progress is stored on the phone.

## Personal training profile (default, editable in Settings or the dashboard)
€100 virtual bankroll · €2 base bet · European single zero · 30–45-minute sessions · +€10 profit target · −€20 stop-loss · Flat Betting · Hebrew UI.

Stop-win and stop-loss rules control how much a session exposes. They do **not** remove the house edge: with flat €2 bets on Red you reach +€10 before −€20 about **57.4%** of the time (exact gambler's-ruin value, matched by simulation), yet the average session result stays negative.

## What's inside

| Section | Highlights |
|---|---|
| **Dashboard** | Training day X/14, today's lesson and practice objective, *Continue Training*, profile summary + editor, milestones, readiness, bankroll, sessions, wagered, average session result, honest frequency-vs-profit notes |
| **Practice Table** | Explicit session start, enforced stop rules (stake cap + automatic end, never auto-restart), strategy tracker (required vs actual stake, step, next-step need, exposure, table-limit/bankroll failure), educational auto-progression, coach, break reminders, session review |
| **Guided Practice** | 11-step tutorial: highlighted targets, wrong-placement feedback, payout prediction before each spin, per-bet settlement explanation, separate virtual wallet |
| **14-Day Program** | Days 1–3 fundamentals · 4–6 flat-betting sessions · 7–9 strategy comparison · 10–12 casino rehearsals · 13–14 final assessment. Lessons, objectives, exercises, quizzes (incl. numeric payout drills) |
| **Final Assessment** | Knowledge, payouts, strategy risk, bankroll discipline, etiquette + discipline of the last 3 planned sessions → readiness report (profit is never an input) |
| **Simulator** | Profile preset, "reach €110 before €80" experiment across 5 strategies with 95% confidence intervals, single/compare modes, identical seeded spins |
| **Strategy Lab** | 9 systems with worked examples, losing-streak ladder, table-limit failure points, quick Monte Carlo vs flat |
| **Casino Ready** | Buying chips, placards, placing chips, betting closure, payouts, etiquette, EU vs US, La Partage/En Prison, budget, stop rules, chasing; interactive checklist; timed rehearsal with dealer countdown |
| **Bets & Odds** | Tap-to-explore table with probability, true odds, EV and house edge for every bet |

## Architecture
```
src/lib/roulette/   engine, bets, RNG, probability, strategies, simulator (+ Wilson CIs), layout geometry
src/lib/training/   profile, stop rules, program state & milestones, guided steps, readiness report
src/lib/analytics/  session review (discipline score, warnings, recommendations), aggregates
src/lib/coach/      deterministic bilingual coach (+ optional LLM adapter, unchanged)
src/lib/i18n/       typed en/he dictionaries, bet labels, useT()
src/lib/content/    program (en/he), assessment bank, strategies (en/he), casino guide (en/he)
src/store/          zustand + localStorage, schema v2 with migration from v1
```
RTL: the document direction follows the language; the betting layout, recent results and charts are fixed LTR islands, and money values are wrapped in Unicode isolates so amounts like "−€2.50" read correctly inside Hebrew text.

## Recommended first training session
1. Dashboard → check your profile (€100 / €2 / +€10 / −€20) → **Continue Training** (Day 1).
2. Guided Practice steps 1–3 (Red, first dozen, straight 17): predict each payout before spinning.
3. Practice Table → **Start session** → €2 on Red for 10–15 spins. Read the coach, then **End session** and read the review.

See `docs/AUDIT.md` for the pre-change audit and gap analysis.
