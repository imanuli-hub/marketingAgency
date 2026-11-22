# Roulette Academy — Training & Strategy Simulator

A premium, mobile-first roulette **training** app: learn the rules, understand the real maths, test betting systems with Monte Carlo simulation, and rehearse a casino visit with a fixed budget and stopping rules. **Virtual money only. No system beats the house edge, and this app never claims otherwise.**

## Run it

```bash
cd roulette-trainer
npm install
npm run dev        # http://localhost:3000
npm test           # 77 unit tests (engine, payouts, strategies, simulator, coach)
npm run build && npm start   # production build (enables the offline service worker)
```

To use it on an iPhone, run `npm run dev -- -H 0.0.0.0` and open `http://<your-computer-ip>:3000` in Safari on the same Wi-Fi. Use **Share → Add to Home Screen** to install it as an app.

## Features

| Section | What it does |
|---|---|
| **Dashboard** | Bankroll, sessions, spins, wagered, net P/L, return on wagers, actual vs expected (variance), drawdown, strategy performance, readiness score |
| **Practice Table** | European/American wheel (SVG + Framer Motion), realistic chips, tap-to-bet table with edge/corner snapping, undo/clear/repeat/double, table limits, La Partage / En Prison, live coach, session plan, break reminders, stop-loss alerts |
| **Bets & Odds** | Every bet with its placement shown on the table, payout, probability, true odds, EV and house edge; EU vs US comparison; zero rules |
| **Strategy Lab** | 9 systems: mechanics, worked examples, losing-streak ladder with real probabilities, table-limit cut-offs, quick Monte Carlo vs flat betting |
| **Simulator** | Monte Carlo in a Web Worker, up to 50M spins; single or side-by-side comparison on identical seeded spins; distribution, paths, risk of ruin, drawdown, theoretical vs actual loss |
| **14-Day Program** | Daily lessons, exercises and quizzes, ending in a readiness assessment |
| **Casino Ready** | Buying chips, reading placards, dealer flow, etiquette, favourable rules, budgeting, chasing, plus a timed **casino rehearsal** with a dealer countdown and enforced stopping rules |

## Architecture

```
src/lib/roulette/   Pure, framework-free engine (fully unit-tested)
  wheel.ts          pocket orders and colours (37 / 38 pockets)
  bets.ts           bet builders + validation, payouts
  engine.ts         settlement, La Partage / En Prison, limits, bankroll accounting
  rng.ts            crypto RNG (rejection sampling, no modulo bias) + seeded sfc32
  probability.ts    exact per-bet and per-layout EV / variance / streak probability
  strategies.ts     9 staking systems as state machines
  simulator.ts      fast session runner, Monte Carlo, identical-spin comparisons
  layout.ts         table geometry: chip anchors and tap → bet hit-testing
src/lib/coach/      deterministic rule-based coach + optional LLM adapter (llm.ts)
src/lib/content/    lessons, quizzes, strategy and casino guide content
src/store/          zustand store persisted to localStorage
src/workers/        simulation Web Worker
src/components/     UI primitives (shadcn-style, Radix + cva), roulette, charts
```

**Result integrity:** the engine draws the pocket with `crypto.getRandomValues` *before* the animation starts. The wheel then animates the ball's angle relative to the rotor until it lands exactly on that pocket. The animation never decides anything.

## Known limitations

- Data lives in one browser's localStorage; there is no sync or backup beyond JSON export.
- En Prison uses single imprisonment (a second zero loses the bet). In the simulator the imprisoned bet resolves on an independent extra draw, which is statistically equivalent.
- Call bets (Voisins, Tiers, Orphelins) and racetrack betting aren't implemented.
- The coach is rule-based. `src/lib/coach/llm.ts` defines the LLM adapter, but no API route is wired up.
- Strategy-adherence checks in practice mode assume even-money bets.
