import type { LessonSection } from "./program";

export interface GuideTopic {
  id: string;
  title: string;
  summary: string;
  sections: LessonSection[];
}

export const CASINO_GUIDE: GuideTopic[] = [
  {
    id: "chips",
    title: "Buying chips",
    summary: "How to get chips at a roulette table and what 'wheel chips' are.",
    sections: [
      { heading: "At the table", bullets: ["Wait until the current spin is settled (the dolly is off the layout).", "Place your cash flat on the table in front of you — dealers usually can't take cash from your hand.", "Say how you want it: 'Colour, please, $5 each' or 'Cash chips, please'.", "The dealer counts the cash openly, often announces it for the camera, and pushes your chips across."] },
      { heading: "Wheel chips vs cash chips", bullets: ["Many roulette tables issue 'wheel chips' — a colour unique to you, so bets from different players don't get mixed up.", "Each wheel chip's value is set when you buy in (e.g. $1, $5). The colour has no value at any other table or the cashier.", "When you leave, ask the dealer to 'colour up' — exchange wheel chips for standard casino chips. Then cash out at the cage."] },
    ],
  },
  {
    id: "reading",
    title: "Reading the table & placard",
    summary: "Find the wheel type, minimums and maximums before you sit down.",
    sections: [
      { heading: "Wheel type", bullets: ["Look at the head of the layout: one green box (0) = single-zero; two boxes (0 and 00) = double-zero.", "Single-zero tables have about half the house edge (2.70% vs 5.26%). Prefer them, even if the minimum is a bit higher — compare expected loss per hour, not only the minimum."] },
      { heading: "The placard", bullets: ["Inside minimum: often a TOTAL across all inside bets per spin (e.g. $10 total), with a minimum chip value.", "Outside minimum: usually PER bet (e.g. $10 on each outside box).", "Maximums: straight-up max (e.g. $100 per number) and outside max (e.g. $5,000).", "Check for 'La Partage' or 'En Prison' — mostly on European single-zero tables."] },
    ],
  },
  {
    id: "placing",
    title: "Placing bets",
    summary: "Putting chips in the right place, call bets and reaching across the table.",
    sections: [
      { heading: "Placing chips yourself", bullets: ["Inside bets: centre of the number (straight), on a line (split), at an intersection (corner), on the outer edge (street/six line).", "Outside bets: inside the box (dozen, column, red/black…).", "If you can't reach, place chips on the layout near you and ask the dealer: 'Seventeen straight up, please'."] },
      { heading: "Announced (call) bets", body: ["Some European casinos accept 'call bets' on sections of the wheel (Voisins du Zéro, Tiers, Orphelins). These are just bundles of normal splits/straights with the same 2.70% edge. Check the house rules — many casinos only accept them with chips placed in advance."] },
    ],
  },
  {
    id: "closing",
    title: "Betting closure & settlement",
    summary: "What the dealer says and does, and when you get paid.",
    sections: [
      { heading: "Sequence", bullets: ["'Place your bets' — betting is open.", "The dealer spins the wheel and launches the ball.", "'No more bets' (often with a hand wave over the layout) — betting is closed. Late bets are refused or returned.", "The ball lands; the dealer announces the result, e.g. 'Seventeen, black, odd, low'.", "The dolly (marker) goes on the winning number.", "Losing chips are swept. Winning bets are paid, usually starting with outside bets, then inside.", "The dolly is removed — betting reopens."] },
      { heading: "How payouts are calculated", body: ["Winnings = stake × payout odds, and you keep your stake. A $5 corner (8:1) returns $40 winnings + $5 stake. Check each payout; politely ask if something looks wrong — before the next spin."] },
    ],
  },
  {
    id: "etiquette",
    title: "Etiquette",
    summary: "Small habits that make you look like a regular.",
    sections: [
      { heading: "Do", bullets: ["Wait for the dealer to finish paying before placing new bets.", "Keep drinks and bags off the layout.", "Know your bets — dealers are busy at full tables.", "Tipping is common in many countries (e.g. a chip on a bet 'for the dealers'), but always optional."] },
      { heading: "Don't", bullets: ["Touch chips after 'No more bets' — it can look like past-posting (cheating).", "Touch the wheel or ball.", "Blame the dealer; they have no control over the result.", "Hand cash directly to the dealer."] },
    ],
  },
  {
    id: "rules",
    title: "Favourable rules & choosing a table",
    summary: "The few choices that actually change your expected loss.",
    sections: [
      { heading: "Ranked from best to worst for the player", bullets: ["Single-zero with La Partage / En Prison on even-money bets (~1.35–1.39%).", "Single-zero standard (2.70%).", "Double-zero standard (5.26%).", "Double-zero basket bet 0-00-1-2-3 (7.89%) — avoid.", "Triple-zero wheels (0, 00, 000) exist in some places with a ~7.7% edge — avoid."] },
      { heading: "Pace matters too", body: ["A crowded table spins less often, so the same stake costs less per hour. Automated/electronic roulette can spin twice as fast — doubling your expected hourly loss."] },
    ],
  },
  {
    id: "budget",
    title: "Your entertainment budget",
    summary: "Decide the cost of the night in advance.",
    sections: [
      { heading: "Before you go", bullets: ["Set a total budget you're comfortable spending on entertainment — like a concert ticket.", "Bring that amount in cash. Leave cards at home or in the hotel safe.", "Choose your unit: 2–5% of the budget per spin.", "Write the plan on your phone: budget, unit, loss limit, win goal, time limit."] },
      { heading: "Rough cost estimate", body: ["Expected cost ≈ stake per spin × spins per hour × hours × house edge. $10/spin × 35 spins × 2 hours × 2.70% ≈ $19 on a single-zero wheel ($37 on double-zero). Actual results swing widely around that."] },
    ],
  },
  {
    id: "chasing",
    title: "Avoiding chasing losses",
    summary: "The most expensive habit at any casino.",
    sections: [
      { heading: "Warning signs", bullets: ["Raising stakes to 'win it back'.", "Thinking a result is 'due'.", "Staying longer than planned because you're behind.", "Reaching for money outside your budget."] },
      { heading: "What to do", bullets: ["Stop and take a 10-minute break away from the table.", "Re-read your written plan.", "Remember: losses are the cost of the entertainment you already had. They cannot be 'recovered' by a system.", "If gambling stops being fun or you feel unable to stop, seek support from a local responsible-gambling helpline."] },
    ],
  },
  {
    id: "ending",
    title: "Ending on plan",
    summary: "Leave when your plan says so — win or lose.",
    sections: [
      { heading: "Stopping rules", bullets: ["Loss limit reached → stop.", "Win goal reached → stop (or set aside the profit and continue only with the original budget).", "Time limit reached → stop, regardless of result.", "Feeling tired, frustrated or euphoric → take a break."] },
      { heading: "Leaving the table", bullets: ["Wait for the current spin to be settled.", "Ask the dealer to colour up your wheel chips.", "Cash out at the cage.", "Note your result honestly — it's useful data for next time."] },
    ],
  },
];

export const READINESS_CHECKLIST = [
  { id: "wheel", label: "I can tell a single-zero from a double-zero table" },
  { id: "payouts", label: "I know every bet's payout without looking" },
  { id: "edge", label: "I can estimate my expected loss per hour" },
  { id: "systems", label: "I understand no betting system beats the house edge" },
  { id: "budget", label: "I have a written budget, unit size and loss limit" },
  { id: "time", label: "I have a time limit and an alarm set" },
  { id: "chips", label: "I know how to buy in and colour up" },
  { id: "etiquette", label: "I know when not to touch chips" },
  { id: "chase", label: "I know what I'll do if I feel like chasing losses" },
];
