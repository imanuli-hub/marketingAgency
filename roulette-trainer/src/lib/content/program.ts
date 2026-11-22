export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface LessonSection {
  heading: string;
  body?: string[];
  bullets?: string[];
}

export interface ProgramDay {
  day: number;
  phase: string;
  title: string;
  minutes: number;
  goals: string[];
  sections: LessonSection[];
  exercise: { id: string; title: string; description: string; href: string; cta: string };
  quiz: QuizQuestion[];
}

export const PHASES = [
  { days: [1, 2, 3], name: "Rules & bets" },
  { days: [4, 5], name: "Probability & payouts" },
  { days: [6, 7, 8], name: "Strategies" },
  { days: [9, 10], name: "Bankroll & risk" },
  { days: [11, 12], name: "Casino simulation" },
  { days: [13, 14], name: "Review & readiness" },
];

export const PROGRAM: ProgramDay[] = [
  {
    day: 1,
    phase: "Rules & bets",
    title: "How a roulette round works",
    minutes: 15,
    goals: ["Know the parts of the wheel and table", "Understand the betting → spin → settlement cycle", "Know the difference between European and American wheels"],
    sections: [
      { heading: "The wheel", body: ["A European wheel has 37 pockets: numbers 1–36 (alternating red and black) plus a single green 0. An American wheel adds a second green pocket, 00, for 38 pockets.", "Numbers are not in order around the wheel — the sequence is arranged to spread red/black, odd/even and high/low evenly."] },
      { heading: "The layout", body: ["The betting table (the 'layout') shows the numbers in a 3 × 12 grid with the zero(s) at the head. Around the grid are the outside bets: dozens, columns and the even-money boxes."] },
      { heading: "A round, step by step", bullets: ["The dealer invites bets ('Place your bets').", "Players put chips on the layout.", "The dealer spins the wheel one way and launches the ball the other way.", "As the ball slows, the dealer waves a hand and calls 'No more bets'. Chips placed after that are not accepted.", "The ball drops into a pocket. The dealer places a marker (the 'dolly') on the winning number.", "Losing chips are swept away first, then winning bets are paid. Don't touch chips until the dolly is removed."] },
      { heading: "Key idea", body: ["Every spin is a fresh, independent event. The wheel has no memory of previous results."] },
    ],
    exercise: { id: "d1-spins", title: "Play 10 spins on the practice table", description: "Place any bets you like and watch the full cycle: bets → spin → result → settlement. Notice the 'Recent results' strip is labelled as having no predictive value.", href: "/play", cta: "Open practice table" },
    quiz: [
      { q: "How many pockets does a European roulette wheel have?", options: ["36", "37", "38", "40"], answer: 1, explain: "Numbers 1–36 plus a single zero = 37." },
      { q: "What extra pocket does an American wheel have?", options: ["A second 36", "00 (double zero)", "A free-spin pocket", "None"], answer: 1, explain: "American wheels add 00, making 38 pockets." },
      { q: "What does 'No more bets' mean?", options: ["The table is closing for the night", "Bets placed after the call are not accepted for this spin", "You must remove your chips", "Only outside bets are allowed now"], answer: 1, explain: "Once called, betting is closed until the spin is settled." },
      { q: "When may you pick up your winnings?", options: ["As soon as the ball lands", "After the dealer pays you and the dolly is removed", "Before the ball lands, if you're sure", "Whenever you like"], answer: 1, explain: "Wait until the dealer has settled and removed the marker." },
    ],
  },
  {
    day: 2,
    phase: "Rules & bets",
    title: "Inside bets",
    minutes: 20,
    goals: ["Place every type of inside bet", "Memorise the inside payouts", "Understand the payout formula"],
    sections: [
      { heading: "Inside bets are placed on the number grid", bullets: ["Straight up — one number, chip in the centre of the number. Pays 35:1.", "Split — two adjacent numbers, chip on the line between them. Pays 17:1.", "Street — three numbers in a row, chip on the outer edge of the row. Pays 11:1.", "Corner (square) — four numbers, chip where they meet. Pays 8:1.", "Six line (double street) — two adjacent rows, chip on the outer edge where the rows meet. Pays 5:1.", "Trio / First four (European) — 0-1-2 or 0-2-3 pays 11:1; 0-1-2-3 pays 8:1.", "Basket (American) — 0-00-1-2-3 pays 6:1 (the worst bet on the table)."] },
      { heading: "The payout pattern", body: ["Payouts follow 36 ÷ (numbers covered) − 1. Straight: 36/1 − 1 = 35. Split: 36/2 − 1 = 17. Corner: 36/4 − 1 = 8. Because the wheel actually has 37 (or 38) pockets, the casino keeps a small edge on every bet."] },
      { heading: "'X to 1' vs 'X for 1'", body: ["'35 to 1' means you get 35 in winnings and keep your 1-unit stake: 36 back in total. Casinos always quote 'to 1'."] },
    ],
    exercise: { id: "d2-inside", title: "Place one of every inside bet", description: "On the Bets & Odds page, tap through each inside bet to see where the chip sits. Then place a split, street, corner and six line on the practice table.", href: "/learn", cta: "Open Bets & Odds" },
    quiz: [
      { q: "A $5 straight-up bet wins. How much do you receive back in total?", options: ["$175", "$180", "$185", "$35"], answer: 1, explain: "35 × $5 = $175 winnings plus your $5 stake = $180." },
      { q: "What does a corner bet pay?", options: ["5:1", "8:1", "11:1", "17:1"], answer: 1, explain: "Four numbers: 36/4 − 1 = 8 to 1." },
      { q: "Where do you place a split bet on 14 and 17?", options: ["In the middle of 14", "On the line between 14 and 17", "On the edge of the street", "In the 2nd 12 box"], answer: 1, explain: "Splits go on the line shared by two adjacent numbers." },
      { q: "Which bet covers six numbers?", options: ["Street", "Corner", "Six line", "Dozen"], answer: 2, explain: "A six line covers two adjacent streets and pays 5:1." },
    ],
  },
  {
    day: 3,
    phase: "Rules & bets",
    title: "Outside bets and the zero",
    minutes: 15,
    goals: ["Know every outside bet and payout", "Understand how zero affects outside bets", "Know La Partage and En Prison"],
    sections: [
      { heading: "Outside bets", bullets: ["Dozens — 1–12, 13–24 or 25–36. Pays 2:1.", "Columns — one of the three vertical columns ('2 to 1' boxes). Pays 2:1.", "Red / Black, Odd / Even, 1–18 / 19–36 — even-money bets. Pay 1:1."] },
      { heading: "Zero beats every outside bet", body: ["0 (and 00) are neither red nor black, odd nor even, high nor low, and not part of any dozen or column. When the ball lands in a zero pocket, every outside bet loses — that's where the casino's edge on outside bets comes from."] },
      { heading: "Player-friendly zero rules (European tables)", bullets: ["La Partage: when 0 hits, you lose only half of each even-money bet; the other half is returned.", "En Prison: when 0 hits, your even-money bet is 'imprisoned' for the next spin. If it then wins, you get your stake back (no profit); if it loses, it's gone.", "Both cut the edge on even-money bets from 2.70% to about 1.35–1.39%. They never apply to inside bets, dozens or columns."] },
    ],
    exercise: { id: "d3-zero", title: "See La Partage in action", description: "In Settings, switch on La Partage. Then bet Red repeatedly on the practice table until a zero appears and check the result banner.", href: "/settings", cta: "Open settings" },
    quiz: [
      { q: "You bet $10 on Odd and the ball lands on 0 (no special rules). What happens?", options: ["You win $10", "Push — stake returned", "You lose $10", "Bet moves to next spin"], answer: 2, explain: "Zero is not odd. Without La Partage/En Prison the bet loses." },
      { q: "Under La Partage, a $20 Black bet when 0 hits returns…", options: ["$0", "$10", "$20", "$40"], answer: 1, explain: "Half of the even-money stake is returned." },
      { q: "What does a column bet pay?", options: ["1:1", "2:1", "3:1", "5:1"], answer: 1, explain: "12 numbers: 36/12 − 1 = 2 to 1." },
      { q: "Does La Partage apply to a dozen bet?", options: ["Yes", "No — only even-money bets", "Only on American tables", "Only on the first dozen"], answer: 1, explain: "La Partage/En Prison only cover even-money bets." },
    ],
  },
  {
    day: 4,
    phase: "Probability & payouts",
    title: "Probability and true odds",
    minutes: 20,
    goals: ["Calculate the probability of any bet", "Distinguish true odds from payout odds", "Understand independence"],
    sections: [
      { heading: "Probability of winning", body: ["Probability = numbers covered ÷ pockets on the wheel.", "Straight up (European): 1/37 = 2.70%. Red: 18/37 = 48.65%. Dozen: 12/37 = 32.43%.", "On an American wheel divide by 38 instead: Red is 18/38 = 47.37%."] },
      { heading: "True odds vs payout odds", body: ["True odds against a straight-up bet on a European wheel are 36 to 1 (36 losing pockets, 1 winning). The casino pays 35 to 1. That gap is the house edge."] },
      { heading: "Independence and the gambler's fallacy", body: ["After eight reds in a row, black is NOT more likely. The probability of black on the next spin is still 18/37. Streaks are normal and expected in random sequences.", "'Hot' and 'cold' numbers boards at casinos are entertainment, not information. This app will never predict numbers from history."] },
    ],
    exercise: { id: "d4-prob", title: "Check the coach's probabilities", description: "Place three different layouts on the practice table and compare the coach's 'chance to profit' with your own calculation.", href: "/play", cta: "Open practice table" },
    quiz: [
      { q: "Probability of a single number on a European wheel?", options: ["1/36", "1/37", "1/38", "1/35"], answer: 1, explain: "37 equally likely pockets." },
      { q: "Red has come up 7 times in a row. Probability the next spin is black (European)?", options: ["Higher than 18/37", "Exactly 18/37", "Lower than 18/37", "50%"], answer: 1, explain: "Spins are independent; the wheel has no memory." },
      { q: "What are the true odds against a straight-up bet on an American wheel?", options: ["35 to 1", "36 to 1", "37 to 1", "38 to 1"], answer: 2, explain: "37 losing pockets vs 1 winning pocket." },
      { q: "Chance a dozen bet wins on a European wheel?", options: ["33.33%", "32.43%", "31.58%", "50%"], answer: 1, explain: "12/37 ≈ 32.43%." },
    ],
  },
  {
    day: 5,
    phase: "Probability & payouts",
    title: "Expected value and the house edge",
    minutes: 20,
    goals: ["Calculate expected value", "Know the house edge of each wheel", "Estimate expected loss per hour"],
    sections: [
      { heading: "Expected value (EV)", body: ["EV = (probability of winning × amount won) − (probability of losing × amount lost).", "$1 on Red, European: (18/37 × $1) − (19/37 × $1) = −$1/37 ≈ −$0.027. You lose 2.7 cents per dollar wagered on average.", "$1 straight up: (1/37 × $35) − (36/37 × $1) = −$1/37. Same EV! Every European bet has the same 2.70% edge."] },
      { heading: "House edge by game", bullets: ["European (single zero): 2.70% on every bet.", "European with La Partage / En Prison: ~1.35–1.39% on even-money bets.", "American (double zero): 5.26% on every bet except the basket (7.89%)."] },
      { heading: "Expected loss per session", body: ["Expected loss = total amount wagered × house edge. At $10 per spin, 35 spins per hour on a European wheel: $350 × 2.70% ≈ $9.46 per hour.", "Short sessions vary wildly around that number. Over many hours, results converge towards it."] },
    ],
    exercise: { id: "d5-edge", title: "Watch the edge converge", description: "Run the Simulator with flat betting for 1 session of 10,000 spins, then 1,000 sessions of 100 spins. Compare 'actual loss' with 'expected theoretical loss'.", href: "/simulator", cta: "Open simulator" },
    quiz: [
      { q: "House edge of a European roulette straight-up bet?", options: ["0%", "2.70%", "5.26%", "7.89%"], answer: 1, explain: "1/37 ≈ 2.70%, the same as every other European bet." },
      { q: "Which American bet has the worst edge?", options: ["Straight up", "Red/Black", "Basket 0-00-1-2-3", "Column"], answer: 2, explain: "The basket pays 6:1 for 5 numbers, a 7.89% edge." },
      { q: "You wager $2,000 in total at a European table. Expected loss?", options: ["$27", "$54", "$105", "$0 if you use a system"], answer: 1, explain: "$2,000 × 2.70% = $54." },
      { q: "Does betting on many numbers at once reduce the house edge?", options: ["Yes", "No — it only changes how often you win", "Only with inside bets", "Only on American tables"], answer: 1, explain: "Each bet keeps its edge; combining bets just reshapes the outcomes." },
    ],
  },
  {
    day: 6,
    phase: "Strategies",
    title: "Flat betting and the Martingale",
    minutes: 25,
    goals: ["Understand why flat betting is the baseline", "See exactly how Martingale fails", "Respect table limits"],
    sections: [
      { heading: "Flat betting", body: ["Same stake every spin. Lowest total wagered, so lowest expected loss for the time spent playing. It's the reference point for judging every other system."] },
      { heading: "Martingale", body: ["Double after every loss; after a win, go back to the base. Each completed cycle wins 1 unit.", "The catch: losing streaks happen. 8 losses in a row on even money happens about once every 200 cycles — and needs 255 units in total. Table maximums usually stop you first."] },
      { heading: "Distribution vs expectation", body: ["Martingale turns a fair-ish coin-flip into 'win small often, lose big rarely'. The average outcome is still negative — and because you wager more in total, the expected dollar loss is usually larger."] },
    ],
    exercise: { id: "d6-compare", title: "Martingale vs flat, identical spins", description: "In the Simulator, compare Flat and Martingale with the same seed. Note P(finish ahead) vs the size of the worst losses.", href: "/simulator", cta: "Open simulator" },
    quiz: [
      { q: "Base $5, table max $500. How many bets can a Martingale sequence contain before the next doubling exceeds the max?", options: ["5", "6", "7", "10"], answer: 2, explain: "5, 10, 20, 40, 80, 160, 320 — seven bets. After a 7th straight loss the next bet (640) exceeds $500 and the progression is broken, with 635 lost." },
      { q: "Does Martingale change the house edge?", options: ["Yes, it removes it", "Yes, it halves it", "No", "Only on even-money bets"], answer: 2, explain: "No betting sequence changes the edge per unit wagered." },
      { q: "A Martingale cycle that succeeds wins…", options: ["The total of all bets", "1 base unit", "Double the last bet", "Nothing"], answer: 1, explain: "Each successful cycle nets exactly one base unit." },
      { q: "Why is flat betting the 'baseline'?", options: ["It wins most often", "It has a lower house edge", "It wagers the least for the same number of spins", "Casinos prefer it"], answer: 2, explain: "Expected loss = wagered × edge, and flat betting typically wagers least." },
    ],
  },
  {
    day: 7,
    phase: "Strategies",
    title: "Paroli, D'Alembert and Fibonacci",
    minutes: 25,
    goals: ["Compare positive and negative progressions", "Recognise linear vs exponential growth"],
    sections: [
      { heading: "Positive progression: Paroli", body: ["Raise after wins, reset after losses or after 3 wins. Losses stay small; occasional streaks produce bigger wins. Most cycles still lose 1 unit."] },
      { heading: "D'Alembert", body: ["+1 unit after a loss, −1 after a win. Growth is linear, so it's gentler than Martingale — but it relies on the false belief that results 'even out'."] },
      { heading: "Fibonacci", body: ["Stakes follow 1, 1, 2, 3, 5, 8, 13… One step up after a loss, two back after a win. Slower than Martingale at first, but still exponential."] },
      { heading: "The common thread", body: ["All of these only decide WHEN you bet more. None changes the probability of any spin or the edge on any bet."] },
    ],
    exercise: { id: "d7-lab", title: "Strategy Lab: run quick analyses", description: "Open the Strategy Lab, run the quick analysis for Paroli, D'Alembert and Fibonacci, and compare risk of ruin.", href: "/strategies", cta: "Open Strategy Lab" },
    quiz: [
      { q: "Which system increases stakes after wins?", options: ["Martingale", "D'Alembert", "Paroli", "Fibonacci"], answer: 2, explain: "Paroli is a positive progression." },
      { q: "D'Alembert after two losses from a 1-unit start bets…", options: ["2 units", "3 units", "4 units", "1 unit"], answer: 1, explain: "1 → 2 → 3." },
      { q: "In Fibonacci, after a win you…", options: ["Restart", "Move one step back", "Move two steps back", "Double"], answer: 2, explain: "Two steps back in the sequence." },
      { q: "Which statement is true?", options: ["Paroli has a lower house edge than Martingale", "All these systems carry the same edge per unit wagered", "Fibonacci guarantees profit with enough bankroll", "D'Alembert works because results balance out"], answer: 1, explain: "The edge is a property of the bet, not the sequence." },
    ],
  },
  {
    day: 8,
    phase: "Strategies",
    title: "Labouchère, Oscar's Grind and coverage",
    minutes: 25,
    goals: ["Track a Labouchère line", "Understand Oscar's Grind cycles", "Know what hedging does and doesn't do"],
    sections: [
      { heading: "Labouchère", body: ["Write 1-2-3-4. Bet first + last (5). Win: cross both off. Lose: append the loss. Clear the line to win its total (10 units). Bad runs can make the line, and stakes, balloon."] },
      { heading: "Oscar's Grind", body: ["Target +1 unit per cycle. Keep stakes flat after losses; add one unit after wins, never betting more than needed to finish the cycle. Slow and steady, but long cycles do happen."] },
      { heading: "Coverage / mixed bets", body: ["Combining outside and inside bets (e.g. Black + a six line + zero) covers more pockets and wins more often — but some 'wins' are net losses and the edge is unchanged."] },
    ],
    exercise: { id: "d8-follow", title: "Follow a system with the coach", description: "On the practice table, choose 'Follow a strategy' (e.g. Labouchère) in the Session plan. Play 20 spins and let the coach check each stake.", href: "/play", cta: "Open practice table" },
    quiz: [
      { q: "Labouchère line 1-2-3-4. First bet?", options: ["1", "4", "5", "10"], answer: 2, explain: "First + last = 1 + 4 = 5." },
      { q: "You lose that bet. The line becomes…", options: ["2-3", "1-2-3-4-5", "1-2-3", "Unchanged"], answer: 1, explain: "Append the amount lost." },
      { q: "Oscar's Grind changes the stake after…", options: ["Every loss", "Wins only", "Every spin", "Zero only"], answer: 1, explain: "Stakes rise by one unit after wins (capped by the cycle target)." },
      { q: "Covering 30 of 37 numbers means…", options: ["Guaranteed profit", "You win often but the edge is unchanged", "The house edge is lower", "You can't lose"], answer: 1, explain: "Coverage reshapes outcomes; EV stays negative." },
    ],
  },
  {
    day: 9,
    phase: "Bankroll & risk",
    title: "Bankroll management",
    minutes: 20,
    goals: ["Set a session budget and unit size", "Understand variance and drawdowns", "Plan stop-loss and win goals"],
    sections: [
      { heading: "Budget = cost of entertainment", body: ["Decide before you go how much you're willing to spend — money you can lose without it mattering. That's your entertainment budget. Never top it up from an ATM."] },
      { heading: "Unit size", body: ["A practical guideline: a unit of 1–5% of the session budget. With $200 and $5 units you have 40 units — enough to ride normal swings for an evening."] },
      { heading: "Stop-loss and win goal", bullets: ["Stop-loss: the amount you're prepared to lose this session (often the whole session budget, or less).", "Win goal: an optional point where you stop and keep your profit.", "Time limit: casinos have no clocks. Set an alarm."] },
      { heading: "Variance and drawdowns", body: ["Even flat betting on Red will see losing runs of 8–10 spins in a long evening. A drawdown is the drop from your highest point to your lowest. Plan for it."] },
    ],
    exercise: { id: "d9-plan", title: "Write your casino plan", description: "In Casino Ready, fill in the session planner: budget, unit, loss limit, win goal and time limit.", href: "/casino", cta: "Open Casino Ready" },
    quiz: [
      { q: "Budget $300, unit 2%. Unit size?", options: ["$3", "$6", "$15", "$30"], answer: 1, explain: "2% of $300 = $6." },
      { q: "What should you do when you hit your loss limit?", options: ["Double the next bet", "Switch tables", "End the session", "Withdraw more cash"], answer: 2, explain: "The limit only works if you honour it." },
      { q: "A drawdown is…", options: ["A type of bet", "The fall from a peak balance to a later low", "The dealer's sweep", "A table limit"], answer: 1, explain: "Peak-to-trough decline." },
      { q: "Which is the best source for your gambling budget?", options: ["Rent money", "A credit card advance", "Pre-set entertainment money", "Winnings you expect to make"], answer: 2, explain: "Only spend what you've set aside for entertainment." },
    ],
  },
  {
    day: 10,
    phase: "Bankroll & risk",
    title: "Risk of ruin and simulation",
    minutes: 25,
    goals: ["Read Monte Carlo results", "Understand risk of ruin", "See why 'probability of profit' can mislead"],
    sections: [
      { heading: "Monte Carlo simulation", body: ["Simulating thousands of independent sessions shows the full range of outcomes: median, best and worst 5%, probability of going bust, and more."] },
      { heading: "Risk of ruin", body: ["The probability that a session ends with the bankroll exhausted (or the stop-loss hit). Aggressive progressions push this up sharply, even when they win most sessions."] },
      { heading: "A misleading metric", body: ["'I won 9 of 10 sessions' sounds great — unless the 10th lost more than the other nine won. Always look at the average result and the size of losses, not just the win rate."] },
    ],
    exercise: { id: "d10-ruin", title: "Compare risk of ruin", description: "In the Simulator, compare all strategies with a $200 bankroll, $5 base bet and a $100 stop-loss over 200 spins.", href: "/simulator", cta: "Open simulator" },
    quiz: [
      { q: "A system wins 90% of sessions. Is it profitable?", options: ["Yes", "Not necessarily — check average result and loss size", "Only on European wheels", "Yes, if bankroll is large"], answer: 1, explain: "Small frequent wins can be outweighed by rare large losses." },
      { q: "Risk of ruin is…", options: ["The house edge", "The chance of losing your whole bankroll (or hitting your limit)", "The chance of a zero", "The table maximum"], answer: 1, explain: "It measures the chance the session bankroll runs out." },
      { q: "Why do simulations use many sessions?", options: ["To predict the next number", "To see the distribution of possible outcomes", "To find a winning system", "To slow down the game"], answer: 1, explain: "Many sessions reveal the spread of outcomes." },
      { q: "More spins at a negative-EV game generally…", options: ["Increases expected loss", "Decreases expected loss", "Doesn't matter", "Guarantees a win"], answer: 0, explain: "Expected loss grows with total amount wagered." },
    ],
  },
  {
    day: 11,
    phase: "Casino simulation",
    title: "Casino session rehearsal #1",
    minutes: 30,
    goals: ["Play at real-table pace", "Practise betting before 'No more bets'", "Follow your stopping rules"],
    sections: [
      { heading: "What's different at a real table", bullets: ["The dealer controls the pace: roughly 30–40 spins an hour at a busy table.", "You get a limited time to place bets before the dealer closes betting.", "Chips are often colour-coded per player at roulette ('wheel chips'), bought at the table.", "You can't undo a bet once the spin is underway."] },
      { heading: "Today's drill", body: ["Run a Casino Session with a $200 budget, $5 unit, $100 loss limit, $60 win goal and a 30-minute time limit. Follow the plan exactly, whatever happens."] },
    ],
    exercise: { id: "d11-casino", title: "Complete a casino rehearsal", description: "Start a Casino Session with the plan above and play until a stopping rule ends it.", href: "/casino/session", cta: "Start casino session" },
    quiz: [
      { q: "How many spins per hour are typical at a busy live table?", options: ["5–10", "30–40", "100–120", "300+"], answer: 1, explain: "Roughly 30–40 spins per hour, fewer when crowded." },
      { q: "Roulette 'wheel chips' are…", options: ["Usable at any table", "Colour-coded to you at that roulette table", "Worth double", "Only for high rollers"], answer: 1, explain: "Each player gets a unique colour at the table; cash them out there." },
      { q: "When can you add a bet?", options: ["Any time", "Until the dealer calls 'No more bets'", "After the ball lands", "Only between sessions"], answer: 1, explain: "Betting closes at the dealer's call." },
      { q: "Your plan says stop at −$100. You're at −$95 and feel lucky. You…", options: ["Bet $100 to win it back", "Stop or bet within the remaining $5", "Switch to Martingale", "Ask for credit"], answer: 1, explain: "Honour the plan — that's the skill you're practising." },
    ],
  },
  {
    day: 12,
    phase: "Casino simulation",
    title: "Casino session rehearsal #2: under pressure",
    minutes: 30,
    goals: ["Recognise chasing", "Handle a losing streak calmly", "End on plan"],
    sections: [
      { heading: "Recognising chasing", bullets: ["Raising stakes right after losses to 'get it back'.", "Extending the session past your time limit because you're down.", "Feeling that a win is 'due'.", "Reaching for more money than you planned."] },
      { heading: "Calm responses", bullets: ["Take a break after any big loss.", "Re-read your plan (write it on your phone).", "Remember: the next spin is independent; your past losses don't make a win more likely."] },
    ],
    exercise: { id: "d12-casino", title: "Second rehearsal with a tighter plan", description: "Run another Casino Session with a smaller loss limit. Review the coach's notes after the session ends.", href: "/casino/session", cta: "Start casino session" },
    quiz: [
      { q: "Which is a sign of chasing losses?", options: ["Taking a break", "Raising stakes after losing to win it back", "Betting your planned unit", "Ending at your limit"], answer: 1, explain: "Increasing stakes after losses to recover is chasing." },
      { q: "After 5 losses in a row, your chance on the next even-money bet (European) is…", options: ["Higher", "Lower", "18/37, unchanged", "50%"], answer: 2, explain: "Independent spins." },
      { q: "A good response to a big loss is…", options: ["Bet bigger", "Take a break and check your plan", "Move to the 00 table", "Use a credit card"], answer: 1, explain: "Pause and return to your plan." },
      { q: "If you're ahead at the time limit, you should…", options: ["Keep playing while it's 'hot'", "Stop as planned", "Double your stakes", "Bet it all on one number"], answer: 1, explain: "Results don't run 'hot'; stop on plan." },
    ],
  },
  {
    day: 13,
    phase: "Review & readiness",
    title: "Reading a real table",
    minutes: 20,
    goals: ["Spot table minimums and maximums", "Find favourable rules", "Rehearse etiquette"],
    sections: [
      { heading: "The table placard", bullets: ["Shows the minimum and maximum bet. Often separate for inside (per number or total) and outside (per bet).", "Example: 'Min $10 inside total / $10 outside each. Max $200 straight up, $5,000 outside.'", "Check if the table is single-zero (0) or double-zero (0 and 00) — look at the wheel and the layout's head."] },
      { heading: "Favourable rules", bullets: ["Single-zero wheel: much better than double-zero.", "La Partage or En Prison on even-money bets: better still.", "Avoid the 0-00-1-2-3 basket on American tables."] },
      { heading: "Etiquette", bullets: ["Put cash on the table (not in the dealer's hand) and ask for chips between spins.", "Don't touch your chips after 'No more bets' or before the dealer pays.", "Tipping is customary in many places but always optional.", "Cash out wheel chips at the table before leaving."] },
    ],
    exercise: { id: "d13-guide", title: "Read the Casino Ready guide", description: "Go through every section in Casino Ready and tick the checklist.", href: "/casino", cta: "Open Casino Ready" },
    quiz: [
      { q: "The placard says 'Inside min $10 total'. You want 4 straight-up bets. Minimum per chip?", options: ["$10 each", "$2.50 each (at least the chip minimum)", "$40 each", "$1 each"], answer: 1, explain: "A total minimum can be spread across inside bets, subject to the table's smallest chip." },
      { q: "How do you know a wheel is American?", options: ["It's bigger", "It has both 0 and 00", "It's red", "Higher limits"], answer: 1, explain: "The double-zero pocket identifies it." },
      { q: "How should you buy chips at a table?", options: ["Hand cash to the dealer mid-spin", "Place cash on the layout between spins", "Throw cash on the wheel", "Only at the cashier"], answer: 1, explain: "Place cash on the table between spins; dealers can't take it from your hand." },
      { q: "Before leaving a roulette table you should…", options: ["Keep wheel chips as souvenirs", "Exchange wheel chips for value chips at the table", "Leave them for the next player", "Take them to another game"], answer: 1, explain: "Wheel chips only have value at that table." },
    ],
  },
  {
    day: 14,
    phase: "Review & readiness",
    title: "Final review & readiness assessment",
    minutes: 30,
    goals: ["Review everything", "Pass the readiness assessment", "Finalise your casino plan"],
    sections: [
      { heading: "The five things that matter", bullets: ["Every European bet has a 2.70% edge; American 5.26%. Choose single-zero.", "No betting system changes the edge. They only reshape outcomes.", "Expected loss = total wagered × edge. Control your pace and stake.", "Set budget, unit, loss limit, win goal and time limit before you arrive — and follow them.", "Past spins don't affect future spins. Ever."] },
      { heading: "Final assessment", body: ["Take the readiness assessment below. Aim for 80% or more. Review any missed topics and retake as needed."] },
    ],
    exercise: { id: "d14-plan", title: "Final casino plan", description: "Complete one last Casino Session using exactly the plan you'll use at the real casino.", href: "/casino/session", cta: "Start casino session" },
    quiz: [],
  },
];

export const FINAL_ASSESSMENT: QuizQuestion[] = [
  { q: "House edge on a single-zero (European) wheel?", options: ["1.35%", "2.70%", "5.26%", "0%"], answer: 1, explain: "1/37 ≈ 2.70% on all bets." },
  { q: "A $10 split wins. Total returned?", options: ["$170", "$180", "$110", "$350"], answer: 1, explain: "17 × $10 + $10 stake = $180." },
  { q: "Which rule halves the loss on even-money bets when 0 hits?", options: ["En Prison", "La Partage", "Basket", "Surrender in the US"], answer: 1, explain: "La Partage returns half immediately. En Prison holds it." },
  { q: "Black has hit 9 times. Probability of red next (European)?", options: ["> 18/37", "18/37", "< 18/37", "1/2"], answer: 1, explain: "Independent spins." },
  { q: "Which system can turn roulette into a positive-expectation game?", options: ["Martingale", "Labouchère", "None", "Fibonacci with a big bankroll"], answer: 2, explain: "No staking system changes the edge per unit wagered." },
  { q: "Total wagered $1,500 at a double-zero table. Expected loss?", options: ["~$40", "~$79", "~$118", "$0"], answer: 1, explain: "$1,500 × 5.26% ≈ $79." },
  { q: "Martingale's main risk is…", options: ["Winning too slowly", "Exponential stakes hitting the table max or bankroll", "Dealer refusal", "Lower payouts"], answer: 1, explain: "A long losing streak demands huge bets." },
  { q: "What does a six-line bet pay?", options: ["5:1", "6:1", "8:1", "11:1"], answer: 0, explain: "Six numbers pay 5 to 1." },
  { q: "You hit your loss limit. Best action?", options: ["One more spin", "End the session", "Raise stakes", "Visit the ATM"], answer: 1, explain: "The limit protects your budget only if honoured." },
  { q: "'Hot numbers' boards tell you…", options: ["Which numbers will hit", "Only what happened before — no predictive value", "Which wheel is biased", "The house edge"], answer: 1, explain: "Past results don't change future probabilities." },
  { q: "What does 'No more bets' signal?", options: ["Payouts", "Betting is closed for this spin", "Change of dealer", "Table closing"], answer: 1, explain: "Wait for the next round." },
  { q: "Which metric best shows whether a strategy is profitable?", options: ["Percentage of winning spins", "Average result per session (and size of losses)", "Longest winning streak", "Number of bets placed"], answer: 1, explain: "Win frequency can hide large losses." },
];
