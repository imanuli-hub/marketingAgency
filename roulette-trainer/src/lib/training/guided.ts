import * as B from "@/lib/roulette/bets";
import type { BetSpec, PlacedBet } from "@/lib/roulette/bets";
import type { Locale } from "@/lib/utils/format";

export interface GuidedStep {
  id: string;
  group: "outside" | "inside" | "combo";
  bets: { spec: BetSpec; amount: number }[];
  instruction: Record<Locale, string>;
  /** Optional explanation shown before betting. */
  explain: Record<Locale, string>;
  /** The question asked before the spin, and its numeric answer (euros). */
  question: Record<Locale, string>;
  answer: number;
}

const s = (spec: BetSpec, amount = 2) => ({ spec, amount });
const win = (bets: { spec: BetSpec; amount: number }[]) => bets.reduce((a, b) => a + b.amount * b.spec.payout, 0);
const Q_WIN = { en: "If this bet wins, how much do you win (excluding your stake)?", he: "אם ההימור זוכה, כמה תרוויח (בלי ההימור עצמו)?" };

const raw: Omit<GuidedStep, "answer" | "question">[] = [
  { id: "red", group: "outside", bets: [s(B.red())], instruction: { en: "Place a €2 bet on Red.", he: "הנח הימור של €2 על אדום." }, explain: { en: "Red covers the 18 red numbers and pays 1:1. Zero is green, so it loses on 0.", he: "אדום מכסה את 18 המספרים האדומים ומשלם 1:1. האפס ירוק, ולכן ההימור מפסיד ב-0." } },
  { id: "dozen1", group: "outside", bets: [s(B.dozen(1))], instruction: { en: "Place €2 on the first dozen (1–12).", he: "הנח €2 על התריסר הראשון (1–12)." }, explain: { en: "A dozen covers 12 numbers and pays 2:1.", he: "תריסר מכסה 12 מספרים ומשלם 2:1." } },
  { id: "straight17", group: "inside", bets: [s(B.straight(17))], instruction: { en: "Place a straight-up bet on number 17.", he: "הנח הימור על המספר הבודד 17." }, explain: { en: "Tap the middle of the 17 cell. One number, pays 35:1, wins 1 time in 37.", he: "לחץ במרכז התא של 17. מספר אחד, משלם 35:1, זוכה פעם אחת מתוך 37." } },
  { id: "odd", group: "outside", bets: [s(B.odd())], instruction: { en: "Place €2 on Odd.", he: "הנח €2 על אי-זוגי." }, explain: { en: "Odd covers 18 numbers and pays 1:1. Zero is neither odd nor even.", he: "אי-זוגי מכסה 18 מספרים ומשלם 1:1. האפס אינו זוגי ואינו אי-זוגי." } },
  { id: "high", group: "outside", bets: [s(B.high())], instruction: { en: "Place €2 on High (19–36).", he: "הנח €2 על גבוה (19–36)." }, explain: { en: "19–36 covers 18 numbers and pays 1:1.", he: "19–36 מכסה 18 מספרים ומשלם 1:1." } },
  { id: "column1", group: "outside", bets: [s(B.column(1))], instruction: { en: "Place €2 on the first column (1, 4, 7 … 34).", he: "הנח €2 על העמודה הראשונה (1, 4, 7 … 34)." }, explain: { en: "Use the '2 to 1' box at the end of the column with 1, 4, 7… It pays 2:1.", he: "השתמש בתיבת '2 to 1' בקצה העמודה של 1, 4, 7… משלם 2:1." } },
  { id: "split", group: "inside", bets: [s(B.split(17, 20))], instruction: { en: "Place a €2 split on 17 and 20.", he: "הנח ספליט של €2 על 17 ו-20." }, explain: { en: "Tap the line shared by 17 and 20. Two numbers, pays 17:1.", he: "לחץ על הקו המשותף ל-17 ול-20. שני מספרים, משלם 17:1." } },
  { id: "street", group: "inside", bets: [s(B.street(16))], instruction: { en: "Place a €2 street on 16–18.", he: "הנח סטריט של €2 על 16–18." }, explain: { en: "Tap the outer edge of the 16-17-18 row (next to the dozens). Three numbers, pays 11:1.", he: "לחץ על הקצה החיצוני של השורה 16-17-18 (ליד התריסרים). שלושה מספרים, משלם 11:1." } },
  { id: "corner", group: "inside", bets: [s(B.corner(17))], instruction: { en: "Place a €2 corner on 17, 18, 20, 21.", he: "הנח קורנר של €2 על 17, 18, 20, 21." }, explain: { en: "Tap the point where those four numbers meet. Pays 8:1.", he: "לחץ על הנקודה שבה ארבעת המספרים נפגשים. משלם 8:1." } },
  { id: "sixline", group: "inside", bets: [s(B.sixLine(16))], instruction: { en: "Place a €2 six line on 16–21.", he: "הנח שורה כפולה של €2 על 16–21." }, explain: { en: "Tap the outer edge where the 16–18 and 19–21 rows meet. Six numbers, pays 5:1.", he: "לחץ על הקצה החיצוני במפגש בין השורות 16–18 ו-19–21. שישה מספרים, משלם 5:1." } },
  { id: "combo", group: "combo", bets: [s(B.red()), s(B.straight(17))], instruction: { en: "Combine: €2 on Red and €2 straight up on 17.", he: "שילוב: €2 על אדום ו-€2 על המספר 17." }, explain: { en: "17 is black. If 17 lands, the straight wins €70 but Red loses €2.", he: "17 הוא שחור. אם יוצא 17, המספר הבודד מרוויח €70 אבל האדום מפסיד €2." } },
];

export const GUIDED_STEPS: GuidedStep[] = raw.map((st) =>
  st.id === "combo"
    ? { ...st, question: { en: "If 17 lands, what is your NET result for the spin?", he: "אם יוצא 17, מה התוצאה הנקייה שלך בסיבוב?" }, answer: 70 - 2 }
    : { ...st, question: Q_WIN, answer: win(st.bets) },
);

/** True when the table holds exactly the step's bets (same positions and amounts). */
export function matchesStep(step: GuidedStep, bets: readonly PlacedBet[]): boolean {
  if (bets.length !== step.bets.length) return false;
  return step.bets.every((t) => bets.some((b) => b.key === t.spec.key && Math.abs(b.amount - t.amount) < 1e-9));
}
