import type { Locale } from "@/lib/utils/format";
import type { LessonSection } from "./program-types";

export interface GuideTopic {
  id: string;
  title: string;
  summary: string;
  sections: LessonSection[];
}

const EN: GuideTopic[] = [
  {
    id: "chips", title: "Exchanging money for chips", summary: "Buying in at the table and what 'wheel chips' are.",
    sections: [
      { heading: "At the table", bullets: ["Wait until the current spin is settled (the dolly is off the layout).", "Place your cash flat on the table — dealers usually can't take cash from your hand.", "Say how you want it: 'Colour, please — €2 each' or 'Cash chips, please'.", "The dealer counts the cash openly, then pushes your chips across."] },
      { heading: "Wheel chips vs cash chips", bullets: ["Many roulette tables issue 'wheel chips' in a colour unique to you, so bets don't get mixed up.", "Their value is set when you buy in. The colour has no value at another table or at the cashier.", "Before you leave, ask the dealer to 'colour up' — exchange them for standard chips — then cash out at the cage."] },
    ],
  },
  {
    id: "reading", title: "Table minimums & the placard", summary: "Find the wheel type and the limits before you sit down.",
    sections: [
      { heading: "Wheel type", bullets: ["One green box at the head of the layout (0) = single zero; two boxes (0 and 00) = double zero.", "Single zero has about half the house edge (2.70% vs 5.26%). Prefer it even if the minimum is a little higher — compare expected loss per hour, not just the minimum."] },
      { heading: "The placard", bullets: ["Inside minimum: often a total across all inside bets (e.g. €5 total), with a minimum chip.", "Outside minimum: usually per bet (e.g. €5 on each outside box).", "Maximums: per straight-up number and per outside bet.", "Check your plan: if the minimum is above your €2 unit, choose another table or adjust the unit and stop rules before sitting down."] },
    ],
  },
  {
    id: "placing", title: "Placing chips correctly", summary: "Exact chip positions, and asking the dealer when you can't reach.",
    sections: [
      { heading: "Positions", bullets: ["Straight up: centre of the number.", "Split: on the line between two numbers.", "Street: outer edge of a row of three. Six line: outer edge where two rows meet.", "Corner: at the intersection of four numbers.", "Outside bets: inside their box."] },
      { heading: "Can't reach?", body: ["Place the chips on the layout near you and say the bet clearly: 'Seventeen straight up, please'. Some European casinos also accept announced 'call bets' (Voisins, Tiers, Orphelins) — bundles of normal bets with the same 2.70% edge."] },
    ],
  },
  {
    id: "closing", title: "When betting closes & how payouts work", summary: "What the dealer says, and when you get paid.",
    sections: [
      { heading: "Sequence", bullets: ["'Place your bets' — betting is open.", "The dealer spins the wheel and launches the ball.", "'No more bets' (often with a hand wave) — betting is closed; late bets are refused.", "The result is announced, e.g. 'Seventeen, black, odd, low'.", "The dolly goes on the winning number; losing chips are swept; winners are paid.", "The dolly is removed — betting reopens."] },
      { heading: "Payouts", body: ["Winnings = stake × payout odds, and you keep your stake. A €2 corner (8:1) returns €16 winnings + €2 stake. Check each payout and politely ask if something looks wrong — before the next spin."] },
    ],
  },
  {
    id: "etiquette", title: "Etiquette", summary: "Small habits that make you look like a regular.",
    sections: [
      { heading: "Do", bullets: ["Wait for the dealer to finish paying before placing new bets.", "Keep drinks and bags off the layout.", "Know your bets — dealers are busy at full tables.", "Tipping is common in some countries, always optional."] },
      { heading: "Don't", bullets: ["Touch chips after 'No more bets' — it can look like cheating.", "Touch the wheel or ball.", "Blame the dealer; they have no control over the result.", "Hand cash directly to the dealer."] },
    ],
  },
  {
    id: "rules", title: "European vs American, La Partage & En Prison", summary: "The few choices that actually change your expected loss.",
    sections: [
      { heading: "House edge, best to worst", bullets: ["Single zero with La Partage or En Prison on even-money bets: ~1.35–1.39%.", "Single zero standard: 2.70%.", "Double zero standard: 5.26%.", "Double-zero basket bet 0-00-1-2-3: 7.89% — avoid.", "Triple-zero wheels (0, 00, 000): ~7.7% — avoid."] },
      { heading: "La Partage & En Prison", body: ["When 0 lands, La Partage returns half of each even-money bet; En Prison holds the bet for one more spin (a win returns the stake). Neither applies to inside bets, dozens or columns."] },
      { heading: "Pace matters too", body: ["A crowded table spins less often, so the same stake costs less per hour. Electronic roulette can spin twice as fast — doubling the expected hourly loss."] },
    ],
  },
  {
    id: "budget", title: "Your entertainment budget", summary: "Decide the cost of the visit in advance.",
    sections: [
      { heading: "Before you go", bullets: ["Set a total you're comfortable spending on entertainment — like a concert ticket.", "Bring that amount in cash; leave cards in the hotel safe.", "Choose a unit of about 2% of the budget per spin (€2 of €100).", "Write the plan on your phone: budget, unit, profit target, stop-loss, time limit."] },
      { heading: "Rough cost estimate", body: ["Expected cost ≈ stake × spins per hour × hours × house edge. €2 × 35 spins × 1 hour × 2.70% ≈ €1.89 on single zero (€3.68 on double zero). Real results swing widely around that."] },
    ],
  },
  {
    id: "stopRules", title: "Following stopping rules", summary: "What stop rules do, and how to honour them.",
    sections: [
      { heading: "What they do", body: ["A stop-loss caps what one session can lose; a profit target locks in a good session; a time limit controls how much you wager in total. Together they control exposure.", "They do not remove the casino's advantage: the house edge applies to every bet you place, whatever your plan."] },
      { heading: "How to honour them", bullets: ["Decide the rules before arriving, not at the table.", "When a rule is hit, finish the current spin, colour up and leave the table.", "Never 'restart' straight away. A new session is a new decision, made calmly later."] },
    ],
  },
  {
    id: "chasing", title: "Avoiding chasing losses", summary: "The most expensive habit at any casino.",
    sections: [
      { heading: "Warning signs", bullets: ["Raising stakes to 'win it back'.", "Thinking a result is 'due'.", "Staying longer because you're behind.", "Reaching for money outside your budget."] },
      { heading: "What to do", bullets: ["Take a 10-minute break away from the table.", "Re-read your written plan.", "Remember: losses are the price of entertainment already had; no system recovers them reliably.", "If gambling stops being fun, contact a local responsible-gambling helpline."] },
    ],
  },
];

const HE: GuideTopic[] = [
  {
    id: "chips", title: "החלפת כסף לצ'יפים", summary: "קנייה בשולחן ומה הם 'צ'יפים צבעוניים'.",
    sections: [
      { heading: "בשולחן", bullets: ["חכה שהסיבוב הנוכחי יוכרע (הדולי הוסר מהשולחן).", "הנח את המזומן שטוח על השולחן — בדרך כלל הדילר לא יכול לקחת כסף מהיד.", "אמור איך אתה רוצה: 'צבע, בבקשה — €2 כל אחד' או 'צ'יפים רגילים, בבקשה'.", "הדילר סופר את הכסף בגלוי ומעביר אליך את הצ'יפים."] },
      { heading: "צ'יפים צבעוניים מול צ'יפים רגילים", bullets: ["בשולחנות רולטה רבים מקבלים 'צ'יפים צבעוניים' בצבע ייחודי לך, כדי שההימורים לא יתערבבו.", "הערך שלהם נקבע ברכישה. לצבע אין ערך בשולחן אחר או בקופה.", "לפני שאתה עוזב, בקש מהדילר 'Colour up' — להמיר אותם לצ'יפים רגילים — ואז פדה אותם בקופה."] },
    ],
  },
  {
    id: "reading", title: "מינימום בשולחן והשלט", summary: "זהה את סוג הגלגל ואת המגבלות לפני שאתה מתיישב.",
    sections: [
      { heading: "סוג הגלגל", bullets: ["תיבה ירוקה אחת בראש השולחן (0) = אפס יחיד; שתי תיבות (0 ו-00) = אפס כפול.", "לאפס יחיד יתרון בית של בערך חצי (2.70% לעומת 5.26%). העדף אותו גם אם המינימום מעט גבוה יותר — השווה הפסד צפוי לשעה, לא רק את המינימום."] },
      { heading: "השלט", bullets: ["מינימום פנימי: לרוב סכום כולל של כל ההימורים הפנימיים (למשל €5 סך הכול), עם צ'יפ מינימלי.", "מינימום חיצוני: בדרך כלל לכל הימור (למשל €5 על כל תיבה חיצונית).", "מקסימום: לכל מספר בודד ולכל הימור חיצוני.", "בדוק את התוכנית: אם המינימום גבוה מהיחידה שלך (€2), בחר שולחן אחר או התאם את היחידה וכללי העצירה לפני שאתה מתיישב."] },
    ],
  },
  {
    id: "placing", title: "הנחת צ'יפים נכונה", summary: "מיקומים מדויקים, ובקשה מהדילר כשאי אפשר להגיע.",
    sections: [
      { heading: "מיקומים", bullets: ["מספר בודד: במרכז המספר.", "ספליט: על הקו בין שני מספרים.", "סטריט: בקצה החיצוני של שורה בת שלושה. שורה כפולה: בקצה החיצוני במפגש של שתי שורות.", "קורנר: במפגש של ארבעה מספרים.", "הימורים חיצוניים: בתוך התיבה שלהם."] },
      { heading: "לא מגיע?", body: ["הנח את הצ'יפים על השולחן לידך ואמור את ההימור בבירור: 'שבע-עשרה, סטרייט, בבקשה'. בחלק מבתי הקזינו באירופה מקבלים גם 'הימורים מוכרזים' (Voisins, Tiers, Orphelins) — חבילות של הימורים רגילים עם אותו יתרון של 2.70%."] },
    ],
  },
  {
    id: "closing", title: "מתי ההימורים נסגרים ואיך משלמים", summary: "מה הדילר אומר, ומתי מקבלים תשלום.",
    sections: [
      { heading: "הרצף", bullets: ["'Place your bets' — ההימורים פתוחים.", "הדילר מסובב את הגלגל ומשגר את הכדור.", "'No more bets' (לרוב עם תנועת יד) — ההימורים סגורים; הימורים מאוחרים נדחים.", "התוצאה מוכרזת, למשל 'שבע-עשרה, שחור, אי-זוגי, נמוך'.", "הדולי מונח על המספר הזוכה; צ'יפים מפסידים נאספים; הזוכים מקבלים תשלום.", "הדולי מוסר — ההימורים נפתחים שוב."] },
      { heading: "תשלומים", body: ["רווח = הימור × יחס התשלום, ואתה שומר את ההימור. קורנר של €2 (8:1) מחזיר €16 רווח + €2 הימור. בדוק כל תשלום ושאל בנימוס אם משהו נראה לא נכון — לפני הסיבוב הבא."] },
    ],
  },
  {
    id: "etiquette", title: "הליכות", summary: "הרגלים קטנים שגורמים לך להיראות כמו קבוע.",
    sections: [
      { heading: "כן", bullets: ["חכה שהדילר יסיים לשלם לפני שאתה מהמר שוב.", "שמור משקאות ותיקים מחוץ לשולחן.", "דע מה ההימורים שלך — הדילרים עסוקים בשולחן מלא.", "טיפ לדילר נהוג בחלק מהמדינות, תמיד רשות."] },
      { heading: "לא", bullets: ["לגעת בצ'יפים אחרי 'No more bets' — זה יכול להיראות כמו רמאות.", "לגעת בגלגל או בכדור.", "להאשים את הדילר; אין לו שליטה על התוצאה.", "למסור מזומן ישירות לדילר."] },
    ],
  },
  {
    id: "rules", title: "אירופי מול אמריקאי, La Partage ו-En Prison", summary: "הבחירות המעטות שבאמת משנות את ההפסד הצפוי.",
    sections: [
      { heading: "יתרון הבית, מהטוב לגרוע", bullets: ["אפס יחיד עם La Partage או En Prison בהימורי כסף-שווה: כ-1.35–1.39%.", "אפס יחיד רגיל: 2.70%.", "אפס כפול רגיל: 5.26%.", "הימור הבאסקט 0-00-1-2-3 באפס כפול: 7.89% — להימנע.", "גלגלים עם שלושה אפסים (0, 00, 000): כ-7.7% — להימנע."] },
      { heading: "La Partage ו-En Prison", body: ["כשיוצא 0, ב-La Partage מוחזר חצי מכל הימור כסף-שווה; ב-En Prison ההימור מוחזק לסיבוב נוסף (זכייה מחזירה את ההימור). אף אחד מהם לא חל על הימורים פנימיים, תריסרים או עמודות."] },
      { heading: "גם הקצב חשוב", body: ["שולחן צפוף מסתובב פחות, כך שאותו הימור עולה פחות לשעה. רולטה אלקטרונית יכולה להסתובב פי שניים מהר — ולהכפיל את ההפסד הצפוי לשעה."] },
    ],
  },
  {
    id: "budget", title: "תקציב הבילוי שלך", summary: "החלט מראש כמה הביקור יעלה.",
    sections: [
      { heading: "לפני שיוצאים", bullets: ["קבע סכום שנוח לך להוציא על בילוי — כמו כרטיס להופעה.", "הבא את הסכום הזה במזומן; השאר כרטיסים בכספת המלון.", "בחר יחידה של כ-2% מהתקציב לסיבוב (€2 מתוך €100).", "כתוב את התוכנית בטלפון: תקציב, יחידה, יעד רווח, סטופ-לוס, מגבלת זמן."] },
      { heading: "הערכת עלות גסה", body: ["עלות צפויה ≈ הימור × סיבובים לשעה × שעות × יתרון הבית. ‏€2 × 35 סיבובים × שעה × 2.70% ≈ ‎€1.89 באפס יחיד (‎€3.68 באפס כפול). התוצאות בפועל משתנות מאוד סביב זה."] },
    ],
  },
  {
    id: "stopRules", title: "עמידה בכללי עצירה", summary: "מה כללי עצירה עושים, ואיך לכבד אותם.",
    sections: [
      { heading: "מה הם עושים", body: ["סטופ-לוס מגביל כמה סשן אחד יכול להפסיד; יעד רווח נועל סשן טוב; מגבלת זמן שולטת בכמה אתה ממיר בסך הכול. יחד הם שולטים בחשיפה.", "הם לא מבטלים את יתרון הקזינו: יתרון הבית חל על כל הימור, יהיה אשר יהיה התכנון שלך."] },
      { heading: "איך מכבדים אותם", bullets: ["החלט על הכללים לפני שאתה מגיע, לא בשולחן.", "כשכלל מתקיים, סיים את הסיבוב הנוכחי, המר צ'יפים ועזוב את השולחן.", "לעולם אל 'תתחיל מחדש' מיד. סשן חדש הוא החלטה חדשה, שמתקבלת ברוגע מאוחר יותר."] },
    ],
  },
  {
    id: "chasing", title: "להימנע מרדיפה אחרי הפסדים", summary: "ההרגל היקר ביותר בכל קזינו.",
    sections: [
      { heading: "סימני אזהרה", bullets: ["העלאת הימורים כדי 'להחזיר'.", "מחשבה שתוצאה 'צריכה' להגיע.", "להישאר יותר זמן כי אתה בהפסד.", "להגיע לכסף מחוץ לתקציב."] },
      { heading: "מה לעשות", bullets: ["קח הפסקה של 10 דקות הרחק מהשולחן.", "קרא שוב את התוכנית הכתובה.", "זכור: ההפסדים הם מחיר הבילוי שכבר היה; שום שיטה לא מחזירה אותם באופן אמין.", "אם ההימורים מפסיקים להיות כיף, פנה לקו סיוע מקומי בנושא הימורים."] },
    ],
  },
];

export const CASINO_GUIDE: Record<Locale, GuideTopic[]> = { en: EN, he: HE };

export const READINESS_CHECKLIST: Record<Locale, { id: string; label: string }[]> = {
  en: [
    { id: "wheel", label: "I can tell a single-zero from a double-zero table" },
    { id: "minimums", label: "I can read a placard and check the minimum fits my €2 unit" },
    { id: "payouts", label: "I know every bet's payout without looking" },
    { id: "edge", label: "I can estimate my expected loss per hour" },
    { id: "systems", label: "I understand no betting system beats the house edge" },
    { id: "budget", label: "I have a written budget, unit, profit target and stop-loss" },
    { id: "stopRules", label: "I know stop rules limit exposure but don't remove the edge" },
    { id: "time", label: "I have a time limit and an alarm set" },
    { id: "chips", label: "I know how to buy in and colour up" },
    { id: "etiquette", label: "I know when not to touch chips" },
    { id: "chase", label: "I know what I'll do if I feel like chasing losses" },
  ],
  he: [
    { id: "wheel", label: "אני יודע להבחין בין שולחן עם אפס יחיד לשולחן עם אפס כפול" },
    { id: "minimums", label: "אני יודע לקרוא שלט שולחן ולבדוק שהמינימום מתאים ליחידה שלי (€2)" },
    { id: "payouts", label: "אני יודע את התשלום של כל הימור בעל פה" },
    { id: "edge", label: "אני יודע להעריך את ההפסד הצפוי שלי לשעה" },
    { id: "systems", label: "אני מבין ששום שיטת הימורים לא מנצחת את יתרון הבית" },
    { id: "budget", label: "יש לי תקציב כתוב, יחידה, יעד רווח וסטופ-לוס" },
    { id: "stopRules", label: "אני יודע שכללי עצירה מגבילים חשיפה אבל לא מבטלים את היתרון" },
    { id: "time", label: "יש לי מגבלת זמן ושעון מעורר מכוון" },
    { id: "chips", label: "אני יודע איך לקנות צ'יפים ולהמיר אותם בסוף" },
    { id: "etiquette", label: "אני יודע מתי לא לגעת בצ'יפים" },
    { id: "chase", label: "אני יודע מה אעשה אם ארגיש דחף לרדוף אחרי הפסדים" },
  ],
};
