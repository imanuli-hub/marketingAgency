import type { FinalSection } from "@/lib/training/program-state";
import type { Locale } from "@/lib/utils/format";
import type { QuizQuestion } from "./program-types";

type Bank = Record<FinalSection, QuizQuestion[]>;

const EN: Bank = {
  knowledge: [
    { q: "House edge on a single-zero wheel?", options: ["1.35%", "2.70%", "5.26%", "0%"], answer: 1, explain: "1/37 on every bet." },
    { q: "Which bet covers 12 numbers?", options: ["Six line", "Dozen", "Corner", "Red"], answer: 1, explain: "Dozens and columns cover 12." },
    { q: "Where is a corner chip placed?", options: ["Centre of a number", "Where four numbers meet", "Outer edge of a row", "In a '2 to 1' box"], answer: 1, explain: "At the shared intersection." },
    { q: "Black has hit 9 times. Probability of red next (European)?", options: ["> 18/37", "18/37", "< 18/37", "1/2"], answer: 1, explain: "Independent spins." },
    { q: "Zero lands. Which bet wins?", options: ["Red", "Odd", "Straight-up 0", "First dozen"], answer: 2, explain: "Only bets covering 0 win." },
  ],
  payouts: [
    { type: "numeric", q: "€2 straight-up wins. Total returned (including stake)?", answer: 72, explain: "35 × 2 + 2." },
    { type: "numeric", q: "€5 street wins. Winnings (excluding stake)?", answer: 55, explain: "11 × 5." },
    { type: "numeric", q: "€2 six line wins. Total returned?", answer: 12, explain: "5 × 2 + 2." },
    { type: "numeric", q: "€10 on Red wins. Total returned?", answer: 20, explain: "1 × 10 + 10." },
    { type: "numeric", q: "€3 split wins. Winnings?", answer: 51, explain: "17 × 3." },
  ],
  strategy: [
    { q: "Which system can make roulette a positive-expectation game?", options: ["Martingale", "Fibonacci", "None", "Labouchère with a big bankroll"], answer: 2, explain: "No staking order changes the edge." },
    { q: "Martingale's main risk is…", options: ["Winning too slowly", "Exponential stakes hitting the table max or bankroll", "Lower payouts", "Dealer refusal"], answer: 1, explain: "A losing streak demands huge bets." },
    { q: "A progression finishes ahead in 80% of sessions. This means…", options: ["It's profitable", "Its rare losses may outweigh frequent small wins", "The edge is lower", "It predicts results"], answer: 1, explain: "Check the average and the tail." },
    { q: "Which metric best judges a strategy?", options: ["% of winning spins", "Average result and size of losses", "Longest winning streak", "Number of bets"], answer: 1, explain: "Win frequency can hide large losses." },
    { q: "Progressions mostly change…", options: ["The house edge", "The distribution of results", "The probability of each spin", "The payouts"], answer: 1, explain: "Shape, not expectation." },
  ],
  bankroll: [
    { q: "Your loss limit is −€20 and you're at −€20. Best action?", options: ["One more spin", "End the session", "Double the stake", "Visit the ATM"], answer: 1, explain: "A limit only works if honoured." },
    { q: "Budget €100, unit 2%. Unit size?", options: ["€0.20", "€2", "€5", "€20"], answer: 1, explain: "2% of €100." },
    { q: "Total wagered €400 at a European table. Expected loss?", options: ["€4", "€10.80", "€21", "€0"], answer: 1, explain: "€400 × 2.70%." },
    { q: "Stop rules…", options: ["Remove the house edge", "Limit how much a session exposes", "Guarantee a profit", "Predict streaks"], answer: 1, explain: "They control exposure only." },
    { q: "You finished +€10 in one session. That shows…", options: ["Skill", "Mostly variance (luck)", "A beaten edge", "A working system"], answer: 1, explain: "Short sessions are dominated by variance." },
  ],
  etiquette: [
    { q: "How do you buy chips at the table?", options: ["Hand cash to the dealer mid-spin", "Place cash on the layout between spins", "Throw cash on the wheel", "Only at the cage"], answer: 1, explain: "Between spins, on the table." },
    { q: "After 'No more bets' you should…", options: ["Move chips", "Add a late bet", "Not touch your chips", "Remove losing bets"], answer: 2, explain: "Touching chips can look like past-posting." },
    { q: "When can you collect winnings?", options: ["As the ball lands", "After the dealer pays and removes the dolly", "Before the spin ends", "Anytime"], answer: 1, explain: "Wait for settlement." },
    { q: "Before leaving the table you should…", options: ["Keep wheel chips", "Colour up wheel chips", "Leave them for others", "Take them to blackjack"], answer: 1, explain: "Wheel chips only work at that table." },
    { q: "How do you identify an American wheel?", options: ["It's red", "It has 0 and 00", "Higher limits", "It spins faster"], answer: 1, explain: "The 00 pocket." },
  ],
};

const HE: Bank = {
  knowledge: [
    { q: "מה יתרון הבית בגלגל עם אפס יחיד?", options: ["1.35%", "2.70%", "5.26%", "0%"], answer: 1, explain: "‎1/37 בכל הימור." },
    { q: "איזה הימור מכסה 12 מספרים?", options: ["שורה כפולה", "תריסר", "קורנר", "אדום"], answer: 1, explain: "תריסרים ועמודות מכסים 12." },
    { q: "איפה מניחים צ'יפ של קורנר?", options: ["במרכז מספר", "במפגש של ארבעה מספרים", "בקצה החיצוני של שורה", "בתיבת '2 to 1'"], answer: 1, explain: "בנקודת המפגש המשותפת." },
    { q: "שחור יצא 9 פעמים. מה הסיכוי לאדום בסיבוב הבא (אירופי)?", options: ["> 18/37", "18/37", "< 18/37", "1/2"], answer: 1, explain: "סיבובים בלתי תלויים." },
    { q: "יוצא אפס. איזה הימור זוכה?", options: ["אדום", "אי-זוגי", "מספר בודד 0", "תריסר ראשון"], answer: 2, explain: "רק הימורים שמכסים את 0 זוכים." },
  ],
  payouts: [
    { type: "numeric", q: "€2 על מספר בודד זוכה. כמה מוחזר בסך הכול (כולל ההימור)?", answer: 72, explain: "‎35 × 2 + 2." },
    { type: "numeric", q: "€5 על סטריט זוכה. מה הרווח (בלי ההימור)?", answer: 55, explain: "‎11 × 5." },
    { type: "numeric", q: "€2 על שורה כפולה זוכה. כמה מוחזר בסך הכול?", answer: 12, explain: "‎5 × 2 + 2." },
    { type: "numeric", q: "€10 על אדום זוכה. כמה מוחזר בסך הכול?", answer: 20, explain: "‎1 × 10 + 10." },
    { type: "numeric", q: "€3 על ספליט זוכה. מה הרווח?", answer: 51, explain: "‎17 × 3." },
  ],
  strategy: [
    { q: "איזו שיטה יכולה להפוך רולטה למשחק עם תוחלת חיובית?", options: ["מרטינגייל", "פיבונאצ'י", "אף אחת", "לבושר עם קופה גדולה"], answer: 2, explain: "שום סדר הימורים לא משנה את היתרון." },
    { q: "הסיכון העיקרי של מרטינגייל הוא…", options: ["זכייה איטית מדי", "הימורים מעריכיים שנתקלים במגבלת השולחן או הקופה", "תשלומים נמוכים יותר", "סירוב של הדילר"], answer: 1, explain: "רצף הפסדים דורש הימורים עצומים." },
    { q: "שיטת התקדמות מסיימת ברווח ב-80% מהסשנים. המשמעות…", options: ["היא רווחית", "ההפסדים הנדירים שלה עשויים לעלות על הזכיות הקטנות והתכופות", "היתרון נמוך יותר", "היא חוזה תוצאות"], answer: 1, explain: "בדוק את הממוצע ואת הזנב." },
    { q: "איזה מדד הכי טוב לשפוט אסטרטגיה?", options: ["% הסיבובים הזוכים", "התוצאה הממוצעת וגודל ההפסדים", "רצף הזכיות הארוך", "מספר ההימורים"], answer: 1, explain: "שכיחות זכייה יכולה להסתיר הפסדים גדולים." },
    { q: "שיטות התקדמות משנות בעיקר את…", options: ["יתרון הבית", "התפלגות התוצאות", "הסיכוי של כל סיבוב", "התשלומים"], answer: 1, explain: "צורה, לא תוחלת." },
  ],
  bankroll: [
    { q: "מגבלת ההפסד שלך −€20 ואתה ב-−€20. מה עושים?", options: ["עוד סיבוב אחד", "מסיימים את הסשן", "מכפילים את ההימור", "הולכים לכספומט"], answer: 1, explain: "מגבלה עובדת רק אם מכבדים אותה." },
    { q: "תקציב €100, יחידה 2%. מה גודל היחידה?", options: ["€0.20", "€2", "€5", "€20"], answer: 1, explain: "2% מ-€100." },
    { q: "סך ההמרה €400 בשולחן אירופי. מה ההפסד הצפוי?", options: ["€4", "€10.80", "€21", "€0"], answer: 1, explain: "‎€400 × 2.70%." },
    { q: "כללי עצירה…", options: ["מבטלים את יתרון הבית", "מגבילים כמה סשן חושף", "מבטיחים רווח", "חוזים רצפים"], answer: 1, explain: "הם שולטים רק בחשיפה." },
    { q: "סיימת סשן ב-+€10. זה מראה…", options: ["מיומנות", "בעיקר שונות (מזל)", "שניצחת את היתרון", "שיטה שעובדת"], answer: 1, explain: "סשנים קצרים נשלטים על ידי שונות." },
  ],
  etiquette: [
    { q: "איך קונים צ'יפים בשולחן?", options: ["מוסרים מזומן לדילר באמצע סיבוב", "מניחים מזומן על השולחן בין סיבובים", "זורקים מזומן על הגלגל", "רק בקופה"], answer: 1, explain: "בין סיבובים, על השולחן." },
    { q: "אחרי 'No more bets' כדאי…", options: ["להזיז צ'יפים", "להוסיף הימור מאוחר", "לא לגעת בצ'יפים", "להוריד הימורים מפסידים"], answer: 2, explain: "נגיעה בצ'יפים עלולה להיראות כרמאות." },
    { q: "מתי אוספים זכיות?", options: ["ברגע שהכדור נוחת", "אחרי שהדילר שילם והסיר את הדולי", "לפני סוף הסיבוב", "מתי שרוצים"], answer: 1, explain: "חכה להכרעה." },
    { q: "לפני שעוזבים את השולחן צריך…", options: ["לשמור את הצ'יפים הצבעוניים", "להמיר את הצ'יפים הצבעוניים (Colour up)", "להשאיר אותם לאחרים", "לקחת אותם לבלאק-ג'ק"], answer: 1, explain: "צ'יפים צבעוניים שווים כסף רק בשולחן הזה." },
    { q: "איך מזהים גלגל אמריקאי?", options: ["הוא אדום", "יש בו 0 ו-00", "מגבלות גבוהות", "הוא מסתובב מהר יותר"], answer: 1, explain: "הכיס 00." },
  ],
};

export const ASSESSMENT: Record<Locale, Bank> = { en: EN, he: HE };
