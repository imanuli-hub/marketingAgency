import { betLabel } from "@/lib/i18n/bet-labels";
import { isEvenMoney } from "@/lib/roulette/bets";
import { betMath, layoutMath, probLosingStreak, probReachBefore } from "@/lib/roulette/probability";
import { createStrategy } from "@/lib/roulette/strategies";
import { pocketColor, pocketCount } from "@/lib/roulette/wheel";
import { fmtMoney as money, fmtPct, type Locale } from "@/lib/utils/format";
import type { CoachInput, CoachProvider, Insight } from "./types";

const pct = (x: number, d = 1) => fmtPct(x, d);

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

type Msg = [title: string, body: string];
const COLOR: Record<Locale, Record<string, string>> = {
  en: { red: "red", black: "black", green: "green" },
  he: { red: "אדום", black: "שחור", green: "ירוק" },
};

/** All coach wording, per language. Numbers always come from the deterministic maths. */
const M = {
  en: {
    stopLossHit: (loss: string, limit: string): Msg => ["Loss limit reached", `You are down ${loss}, which meets your loss limit of ${limit}. Your plan says this session is over. Ending now is the single most valuable casino skill you can practise.`],
    stopLossNear: (used: string, limit: string, left: string): Msg => ["Approaching your loss limit", `You have used ${used} of your ${limit} loss limit. Only ${left} remains before your plan says stop.`],
    stopLossBet: (stake: string): Msg => ["This bet could breach your limit", `Losing this ${stake} spin would take you past your loss limit.`],
    stopWinHit: (up: string, target: string): Msg => ["Profit target reached", `You are up ${up} — at or above your ${target} target. The house edge applies to every further spin, so a planned stop here locks in a good session. The profit came from variance, not from an edge.`],
    stopRules: (target: string, limit: string, p: string | null): Msg => ["What your stop rules do", `Stopping at +${target} or −${limit} controls how much of your budget one session can expose. It does not change the 2.70% edge on any bet: the average result per euro wagered is the same.${p ? ` With flat even-money bets, the chance of reaching +${target} before −${limit} is about ${p} — but the losses are twice the size of the wins.` : ""}`],
    breakMsg: (mins: number): Msg => [`You've been playing for ${mins} minutes`, "A short break helps keep decisions deliberate. Real casinos are designed so you lose track of time — practise noticing it."],
    chasing: (from: string, to: string): Msg => ["Raising stakes after a loss", `Your stake went from ${from} to ${to} right after losing. Bigger bets don't make a win more likely — the next spin is independent — they only increase how much is at risk. If this isn't part of a plan you set before playing, it's chasing.`],
    chasingPattern: (n: number, x: string): Msg => ["Pattern: stakes climb after losses", `${n} times this session you raised your stake after a loss, and you're now betting ${x}× your opening stake.`],
    streak: (k: number, p: string, spins: number): Msg => [`${k} losing spins in a row`, `Streaks like this are normal: over ${spins} spins, the chance of at least one run of ${k}+ losses on an even-money bet is about ${p}. The next spin is still independent — nothing is "due".`],
    fallacy: (k: number, color: string, opposite: string, p: string): Msg => [`${k} ${color}s in a row — ${opposite} is not "due"`, `The wheel has no memory. ${opposite[0].toUpperCase() + opposite.slice(1)} still wins ${p} of the time on this spin, exactly as it did before the streak.`],
    how: (): Msg => ["Place a bet", "Pick a chip value, then tap the table. Tap the middle of a number for a straight-up bet, its edge for a split, a corner where four numbers meet, or the outside boxes (Red, Odd, 1st 12…) for simpler bets that win more often but pay less."],
    idle: (): Msg => ["No bets on the table", "Every layout you can build has the same house edge per unit wagered on this wheel. What you choose changes how often you win and by how much — not the long-run cost."],
    betsList: (lines: string[]): Msg => ["Your bets explained", lines.join(" · ")],
    betLine: (label: string, payout: number, p: string, win: string) => `${label}: pays ${payout}:1, wins ${p} of spins, net +${win} if it wins`,
    betBeginner: (stake: string, any: string, best: string, worst: string): Msg => [`Betting ${stake}`, `At least one of your bets wins on ${any} of spins. Best result ${best}, worst ${worst}.`],
    betSummary: (stake: string, pP: string, any: string, pL: string, worst: string, best: string, ev: string, edge: string): Msg => [`${stake} at risk · ${pP} chance to profit`, `P(any bet wins) ${any}, P(net profit) ${pP}, P(net loss) ${pL}. Range: ${worst} to +${best}. Expected result ${ev} (house edge ${edge}).`],
    exposureDanger: (p: string): Msg => [`${p} of your bankroll on one spin`, "A single spin can wipe out a large share of your money. Keep each spin to 1–5% of your session budget so the budget lasts."],
    exposureWarn: (p: string): Msg => [`${p} of your bankroll on one spin`, "That's a large share per spin. At 1–5% per spin your budget survives normal losing runs."],
    exposureOk: (p: string): Msg => [`Exposure ${p} of bankroll`, "A sustainable stake size relative to your bankroll."],
    coverage: (p: string): Msg => [`Covering ${p} of the wheel`, "Covering most numbers means frequent small wins — and occasional larger losses. The expected cost per unit wagered is unchanged; you've only reshaped the outcomes."],
    basket: (edge: string): Msg => ["The basket is the worst bet on the table", `0-00-1-2-3 pays 6:1 for 5 numbers: a ${edge} house edge versus 5.26% for every other American bet.`],
    wheel: (): Msg => ["Double-zero wheel", "The extra 00 pocket almost doubles the house edge (5.26% vs 2.70%). Prefer a single-zero table."],
    partage: (name: string, edge: string): Msg => [`${name} protects your even-money bets`, `On zero you lose only about half of an even-money bet, cutting its house edge to ${edge}. Other bets keep the 2.70% edge.`],
    longrun: (n: number, ev: string, evS: string, sd: string, evN: string, sdN: string, p: string): Msg => [`Repeat this ${n} times: expect ${evN}`, `Per spin: EV ${ev}, σ ${sd}. Over ${n} spins: mean ${evN}, ±1σ ≈ ${sdN}. Normal approx. P(ahead) ≈ ${p}. Variance dominates short sessions; the edge dominates long ones. (${evS})`],
    ruin: (bank: string, spins: string): Msg => ["Bankroll horizon", `At this layout the expected loss would consume your ${bank} bankroll in about ${spins} spins on average — and variance means it can happen far sooner. Use the Simulator for a full risk-of-ruin estimate.`],
    edge: (cost: string, stake: string, edge: string, hour: string): Msg => [`Expected cost: ${cost} per spin`, `${stake} × ${edge} house edge. At ~35 spins an hour that's about ${hour} per hour on average — budget for it like the price of entertainment.`],
    strategyOk: (stake: string, state: string): Msg => ["Following your strategy", `Your ${stake} stake matches the system's next bet (${state}).`],
    strategyOff: (exp: string, state: string, stake: string): Msg => ["Off your strategy", `Your system calls for ${exp} next (${state}), but you have ${stake} on the table.`],
    strategyLimit: (exp: string, max: string): Msg => ["The progression has hit the table limit", `Your system now requires ${exp}, but the table maximum is ${max}. This is exactly how negative progressions fail: you can't place the bet that was supposed to recover the losses.`],
    strategyBankroll: (exp: string, bal: string): Msg => ["Not enough bankroll for the next step", `Your system requires ${exp} but only ${bal} is available. The progression can't continue — the losses so far are locked in.`],
    sessionsNote: "La Partage", prisonNote: "En Prison",
  },
  he: {
    stopLossHit: (loss: string, limit: string): Msg => ["הגעת למגבלת ההפסד", `אתה בהפסד של ${loss}, שמגיע למגבלת ההפסד שלך (${limit}). לפי התוכנית, הסשן הסתיים. לעצור עכשיו — זו המיומנות החשובה ביותר שאפשר לתרגל לקראת הקזינו.`],
    stopLossNear: (used: string, limit: string, left: string): Msg => ["מתקרב למגבלת ההפסד", `ניצלת ${used} ממגבלת ההפסד שלך (${limit}). נותרו רק ${left} לפני שהתוכנית אומרת לעצור.`],
    stopLossBet: (stake: string): Msg => ["ההימור הזה עלול לחרוג מהמגבלה", `הפסד בסיבוב של ${stake} יעביר אותך מעבר למגבלת ההפסד.`],
    stopWinHit: (up: string, target: string): Msg => ["הגעת ליעד הרווח", `אתה ברווח של ${up} — ביעד של ${target} או מעליו. יתרון הבית חל על כל סיבוב נוסף, ולכן עצירה מתוכננת כאן שומרת על סשן טוב. הרווח נבע משונות (מזל), לא מיתרון.`],
    stopRules: (target: string, limit: string, p: string | null): Msg => ["מה כללי העצירה שלך עושים", `עצירה ברווח של ${target} או בהפסד של ${limit} שולטת בכמה מהתקציב סשן אחד יכול לחשוף. היא לא משנה את יתרון הבית של 2.70% על אף הימור: התוצאה הממוצעת לכל יורו שהומר נשארת זהה.${p ? ` בהימורי כסף-שווה קבועים, הסיכוי להגיע לרווח של ${target} לפני הפסד של ${limit} הוא בערך ${p} — אבל ההפסדים כפולים בגודלם מהרווחים.` : ""}`],
    breakMsg: (mins: number): Msg => [`אתה משחק כבר ${mins} דקות`, "הפסקה קצרה עוזרת לשמור על החלטות שקולות. קזינו אמיתי בנוי כך שתאבד תחושת זמן — תרגל לשים לב לזה."],
    chasing: (from: string, to: string): Msg => ["העלאת הימור אחרי הפסד", `ההימור שלך עלה מ-${from} ל-${to} מיד אחרי הפסד. הימור גדול יותר לא מגדיל את הסיכוי לזכות — הסיבוב הבא בלתי תלוי — הוא רק מגדיל את הסכום בסיכון. אם זה לא חלק מתוכנית שקבעת מראש, זה "רדיפה אחרי הפסדים".`],
    chasingPattern: (n: number, x: string): Msg => ["דפוס: ההימורים עולים אחרי הפסדים", `${n} פעמים בסשן הזה העלית הימור אחרי הפסד, וכעת אתה מהמר פי ${x} מההימור הפותח.`],
    streak: (k: number, p: string, spins: number): Msg => [`${k} סיבובים מפסידים ברצף`, `רצפים כאלה נורמליים: לאורך ${spins} סיבובים, הסיכוי לרצף של לפחות ${k} הפסדים בהימור כסף-שווה הוא בערך ${p}. הסיבוב הבא עדיין בלתי תלוי — שום דבר לא "מגיע".`],
    fallacy: (k: number, color: string, opposite: string, p: string): Msg => [`${k} פעמים ${color} ברצף — ${opposite} לא "צריך" לצאת`, `לרולטה אין זיכרון. ${opposite} עדיין מנצח ב-${p} מהסיבובים, בדיוק כמו לפני הרצף.`],
    how: (): Msg => ["הנח הימור", "בחר ערך צ'יפ ולחץ על השולחן. מרכז מספר = הימור על מספר בודד, קו בין שני מספרים = ספליט, נקודת מפגש של ארבעה מספרים = קורנר, והתיבות החיצוניות (אדום, אי-זוגי, תריסר…) = הימורים פשוטים שזוכים לעיתים קרובות יותר אך משלמים פחות."],
    idle: (): Msg => ["אין הימורים על השולחן", "לכל צירוף הימורים בגלגל הזה יש אותו יתרון בית ליחידה מהומרת. הבחירה שלך משנה כמה פעמים תזכה ובכמה — לא את העלות לטווח הארוך."],
    betsList: (lines: string[]): Msg => ["ההימורים שלך — הסבר", lines.join(" · ")],
    betLine: (label: string, payout: number, p: string, win: string) => `${label}: משלם ${payout}:1, זוכה ב-${p} מהסיבובים, רווח נקי של ${win} בזכייה`,
    betBeginner: (stake: string, any: string, best: string, worst: string): Msg => [`מהמר ${stake}`, `לפחות אחד ההימורים שלך זוכה ב-${any} מהסיבובים. התוצאה הטובה ביותר ${best}, הגרועה ביותר ${worst}.`],
    betSummary: (stake: string, pP: string, any: string, pL: string, worst: string, best: string, ev: string, edge: string): Msg => [`${stake} בסיכון · ${pP} סיכוי לרווח`, `סיכוי שהימור כלשהו יזכה ${any}, סיכוי לרווח נקי ${pP}, סיכוי להפסד נקי ${pL}. טווח: מ-${worst} ועד רווח של ${best}. תוצאה צפויה ${ev} (יתרון בית ${edge}).`],
    exposureDanger: (p: string): Msg => [`${p} מהקופה על סיבוב אחד`, "סיבוב יחיד יכול למחוק חלק גדול מהכסף. שמור כל סיבוב על 1–5% מתקציב הסשן כדי שהתקציב יחזיק."],
    exposureWarn: (p: string): Msg => [`${p} מהקופה על סיבוב אחד`, "זה חלק גדול לסיבוב. ב-1–5% לסיבוב התקציב שורד רצפי הפסד רגילים."],
    exposureOk: (p: string): Msg => [`חשיפה של ${p} מהקופה`, "גודל הימור בר-קיימא ביחס לקופה שלך."],
    coverage: (p: string): Msg => [`מכסה ${p} מהגלגל`, "כיסוי רוב המספרים פירושו זכיות קטנות ותכופות — והפסדים גדולים מדי פעם. העלות הצפויה ליחידה לא השתנתה; רק עיצבת מחדש את התוצאות."],
    basket: (edge: string): Msg => ["הבאסקט הוא ההימור הגרוע בשולחן", `0-00-1-2-3 משלם 6:1 על 5 מספרים: יתרון בית של ${edge} לעומת 5.26% לכל הימור אמריקאי אחר.`],
    wheel: (): Msg => ["גלגל עם אפס כפול", "הכיס הנוסף 00 כמעט מכפיל את יתרון הבית (5.26% לעומת 2.70%). העדף שולחן עם אפס יחיד."],
    partage: (name: string, edge: string): Msg => [`${name} מגן על הימורי הכסף-שווה שלך`, `כשיוצא אפס אתה מפסיד רק כמחצית מהימור כסף-שווה, ויתרון הבית יורד ל-${edge}. שאר ההימורים נשארים עם 2.70%.`],
    longrun: (n: number, ev: string, evS: string, sd: string, evN: string, sdN: string, p: string): Msg => [`חזור על זה ${n} פעמים: צפוי ${evN}`, `לסיבוב: תוחלת ${ev}, סטיית תקן ${sd}. לאורך ${n} סיבובים: ממוצע ${evN}, ±1σ ≈ ${sdN}. בקירוב נורמלי, הסיכוי להיות ברווח ≈ ${p}. השונות שולטת בסשנים קצרים; יתרון הבית שולט בארוכים. (${evS})`],
    ruin: (bank: string, spins: string): Msg => ["אופק הקופה", `בצירוף הזה, ההפסד הצפוי יכלה את הקופה שלך (${bank}) בתוך כ-${spins} סיבובים בממוצע — ובגלל השונות זה יכול לקרות הרבה יותר מהר. השתמש בסימולטור להערכת סיכון פשיטת רגל מלאה.`],
    edge: (cost: string, stake: string, edge: string, hour: string): Msg => [`עלות צפויה: ${cost} לסיבוב`, `${stake} × יתרון בית ${edge}. בכ-35 סיבובים לשעה זה בערך ${hour} לשעה בממוצע — תקצב את זה כמו מחיר של בילוי.`],
    strategyOk: (stake: string, state: string): Msg => ["אתה פועל לפי האסטרטגיה", `ההימור שלך (${stake}) תואם את ההימור הבא של השיטה (${state}).`],
    strategyOff: (exp: string, state: string, stake: string): Msg => ["סטייה מהאסטרטגיה", `השיטה שלך דורשת ${exp} בסיבוב הבא (${state}), אבל על השולחן יש ${stake}.`],
    strategyLimit: (exp: string, max: string): Msg => ["ההתקדמות נתקלה במגבלת השולחן", `השיטה דורשת עכשיו ${exp}, אבל המקסימום בשולחן הוא ${max}. בדיוק כך נכשלות שיטות הכפלה: אי אפשר להניח את ההימור שהיה אמור להחזיר את ההפסדים.`],
    strategyBankroll: (exp: string, bal: string): Msg => ["אין מספיק כסף לשלב הבא", `השיטה דורשת ${exp} אבל זמינים רק ${bal}. ההתקדמות לא יכולה להמשיך — ההפסדים עד כה נעולים.`],
    sessionsNote: "לה פרטאז'", prisonNote: "אן פריזון",
  },
} satisfies Record<Locale, unknown>;

const ins = (id: string, tone: Insight["tone"], [title, body]: Msg): Insight => ({ id, tone, title, body });

/** The stake the selected practice strategy requires next, replayed from session history. */
export function strategyNextStake(
  strategy: { id: Parameters<typeof createStrategy>[0]; baseBet: number },
  spins: { net: number; balanceAfter: number }[],
  balance: number,
  minBet: number,
  locale: Locale = "en",
) {
  const s = createStrategy(strategy.id, { baseBet: strategy.baseBet });
  for (const sp of spins) s.record(sp.net, { bankroll: sp.balanceAfter, minBet, payout: 1 });
  return { stake: s.nextStake({ bankroll: balance, minBet, payout: 1 }), state: s.state(locale) };
}

export function analyze(input: CoachInput): Insight[] {
  const { mode, rules, bets, balance, session } = input;
  const locale: Locale = input.locale ?? "en";
  const m = M[locale];
  const out: Insight[] = [];
  const n = pocketCount(rules.wheel);
  const stake = bets.reduce((s, b) => s + b.amount, 0);
  const spins = session?.spins ?? [];
  const sessionNet = session ? balance - session.startBalance : 0;

  // --- Responsible play checks come first ---------------------------------
  if (session?.stopLoss) {
    const used = -sessionNet / session.stopLoss;
    if (used >= 1 - 1e-9) out.push(ins("stoploss-hit", "danger", m.stopLossHit(money(-sessionNet), money(session.stopLoss))));
    else if (used >= 0.75) out.push(ins("stoploss-near", "warn", m.stopLossNear(pct(used, 0), money(session.stopLoss), money(session.stopLoss + sessionNet))));
    else if (stake > 0 && stake > session.stopLoss + sessionNet + 1e-9) out.push(ins("stoploss-bet", "warn", m.stopLossBet(money(stake))));
  }
  if (session?.stopWin && sessionNet >= session.stopWin - 1e-9) out.push(ins("stopwin-hit", "good", m.stopWinHit(money(sessionNet), money(session.stopWin))));
  if (session && session.stopLoss && session.stopWin && spins.length < 3) {
    const unit = input.strategy?.baseBet ?? 0;
    const p = unit > 0 && rules.wheel === "european" && rules.evenMoneyRule === "none"
      ? pct(probReachBefore(18 / 37, Math.round(session.stopWin / unit), Math.round(session.stopLoss / unit)), 0)
      : null;
    out.push(ins("stop-rules", "info", m.stopRules(money(session.stopWin), money(session.stopLoss), mode === "beginner" ? null : p)));
  }
  if (session && input.breakReminderMins && input.now - session.startedAt > input.breakReminderMins * 60_000) {
    out.push(ins("break", "info", m.breakMsg(Math.floor((input.now - session.startedAt) / 60_000))));
  }

  // Chasing losses: stake raised right after a losing spin (unless a progression plan calls for it).
  const progression = input.strategy && ["martingale", "dalembert", "fibonacci", "labouchere"].includes(input.strategy.id);
  if (spins.length >= 2 && stake > 0) {
    const last = spins[spins.length - 1];
    const k = Math.min(5, spins.length);
    const base = spins.slice(0, k).reduce((s, x) => s + x.staked, 0) / k;
    let raises = 0;
    for (let i = 1; i < spins.length; i++) if (spins[i - 1].net < 0 && spins[i].staked > spins[i - 1].staked * 1.4) raises++;
    if (last.net < 0 && stake >= last.staked * 1.5 && !progression) out.push(ins("chasing", "warn", m.chasing(money(last.staked), money(stake))));
    else if (raises >= 3 && stake > base * 2 && !progression) out.push(ins("chasing-pattern", "warn", m.chasingPattern(raises, (stake / base).toFixed(1))));
  }

  // Losing streak explanation.
  let lossRun = 0;
  for (let i = spins.length - 1; i >= 0 && spins[i].net < 0; i--) lossRun++;
  if (lossRun >= 4) {
    const horizon = Math.max(50, spins.length);
    out.push(ins("streak", "info", m.streak(lossRun, pct(probLosingStreak(19 / 37, lossRun, horizon), 0), horizon)));
  }

  // Gambler's fallacy: betting a colour after a streak.
  const recent = spins.slice(-6).map((s) => pocketColor(s.pocket));
  if (recent.length >= 4 && stake > 0) {
    const lastC = recent[recent.length - 1];
    let streak = 0;
    for (let i = recent.length - 1; i >= 0 && recent[i] === lastC; i--) streak++;
    const opposite = lastC === "red" ? "black" : lastC === "black" ? "red" : null;
    if (streak >= 4 && opposite && bets.some((b) => b.kind === opposite)) {
      out.push(ins("fallacy", "info", m.fallacy(streak, COLOR[locale][lastC], COLOR[locale][opposite], pct(18 / n))));
    }
  }

  // --- The current bet ------------------------------------------------------
  if (!bets.length) {
    out.push(ins(mode === "beginner" ? "how" : "idle", "info", mode === "beginner" ? m.how() : m.idle()));
  } else {
    const lm = layoutMath(bets, rules);
    const exposure = balance > 0 ? stake / balance : 1;
    const evPct = -lm.evPct;

    if (mode !== "advanced") {
      const lines = bets.slice(0, 4).map((b) => m.betLine(betLabel(b, locale), b.payout, pct(betMath(b, rules).pWin), money(b.amount * b.payout)));
      out.push(ins("bets", "info", m.betsList(lines)));
    }
    if (mode === "beginner") out.push(ins("bet", "info", m.betBeginner(money(stake), pct(lm.pAnyWin, 0), money(lm.bestCase, { sign: true }), money(lm.worstCase))));
    else out.push(ins("bet", "info", m.betSummary(money(stake), pct(lm.pProfit), pct(lm.pAnyWin), pct(lm.pLoss), money(lm.worstCase), money(lm.bestCase), money(lm.ev), pct(evPct, 2))));

    if (exposure > 0.25) out.push(ins("exposure", "danger", m.exposureDanger(pct(exposure, 0))));
    else if (exposure > 0.1) out.push(ins("exposure", "warn", m.exposureWarn(pct(exposure, 0))));
    else out.push(ins("exposure", "good", m.exposureOk(pct(exposure, 1))));

    if (lm.coverage >= 0.65 && bets.length >= 3) out.push(ins("coverage", "info", m.coverage(pct(lm.coverage, 0))));
    const basket = bets.find((b) => b.kind === "basket");
    if (basket) out.push(ins("basket", "warn", m.basket(pct(betMath(basket, rules).houseEdge, 2))));
    if (rules.wheel === "american" && mode !== "beginner") out.push(ins("wheel", "info", m.wheel()));
    if (rules.wheel === "european" && rules.evenMoneyRule !== "none" && mode !== "beginner" && bets.some((b) => isEvenMoney(b.kind))) {
      const name = rules.evenMoneyRule === "laPartage" ? m.sessionsNote : m.prisonNote;
      out.push(ins("partage", "good", m.partage(name, pct(betMath({ kind: "red", numbers: Array(18).fill(1), payout: 1 }, rules).houseEdge, 2))));
    }

    if (mode === "advanced") {
      const N = 100;
      out.push(ins("longrun", "info", m.longrun(N, money(lm.ev, { decimals: 2 }), pct(evPct, 2), money(lm.sd, { decimals: 2 }), money(lm.ev * N, { decimals: 2 }), money(lm.sd * Math.sqrt(N), { decimals: 2 }), pct(pAheadAfter(lm.ev, lm.sd, N), 0))));
      if (balance > 0 && -lm.ev > 0) out.push(ins("ruin", "info", m.ruin(money(balance), Math.round(balance / -lm.ev).toLocaleString("en-US"))));
    } else if (mode === "intermediate") {
      out.push(ins("edge", "info", m.edge(money(-lm.ev, { decimals: 2 }), money(stake), pct(evPct, 2), money(-lm.ev * 35, { decimals: 2 }))));
    }
  }

  // --- Strategy adherence ------------------------------------------------
  if (input.strategy && stake > 0) {
    const { stake: expected, state } = strategyNextStake(input.strategy, spins, balance, rules.minBet, locale);
    if (expected > rules.maxOutside + 1e-9) out.push(ins("strategy", "danger", m.strategyLimit(money(expected), money(rules.maxOutside))));
    else if (expected > balance + 1e-9) out.push(ins("strategy", "danger", m.strategyBankroll(money(expected), money(balance))));
    else if (Math.abs(expected - stake) < 0.01) out.push(ins("strategy", "good", m.strategyOk(money(stake), state)));
    else out.push(ins("strategy", "warn", m.strategyOff(money(expected), state, money(stake))));
  }

  return out;
}

export const deterministicCoach: CoachProvider = { analyze };
