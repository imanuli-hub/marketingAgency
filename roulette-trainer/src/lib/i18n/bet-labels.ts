import type { BetKind } from "@/lib/roulette/bets";
import { pocketLabel } from "@/lib/roulette/wheel";
import type { Locale } from "@/lib/utils/format";

const KIND: Record<Locale, Record<BetKind, string>> = {
  en: {
    straight: "Straight", split: "Split", street: "Street", trio: "Trio", corner: "Corner", firstFour: "First Four",
    basket: "Basket", sixLine: "Six Line", dozen: "Dozen", column: "Column", red: "Red", black: "Black",
    odd: "Odd", even: "Even", low: "1–18 (Low)", high: "19–36 (High)",
  },
  he: {
    straight: "מספר בודד", split: "ספליט", street: "סטריט", trio: "טריו", corner: "קורנר", firstFour: "ארבעת הראשונים",
    basket: "באסקט", sixLine: "שורה כפולה", dozen: "תריסר", column: "עמודה", red: "אדום", black: "שחור",
    odd: "אי-זוגי", even: "זוגי", low: "1–18 (נמוך)", high: "19–36 (גבוה)",
  },
};
const ORD = { en: ["1st", "2nd", "3rd"], he: ["ראשון", "שני", "שלישי"] };

export function betKindName(kind: BetKind, locale: Locale): string {
  return KIND[locale][kind];
}

/** Localized bet label from its kind and covered numbers. */
export function betLabel(b: { kind: BetKind; numbers: number[] }, locale: Locale): string {
  const k = KIND[locale][b.kind];
  const n = b.numbers;
  switch (b.kind) {
    case "straight": return `${k} ${pocketLabel(n[0])}`;
    case "split": return `${k} ${n.map(pocketLabel).join("/")}`;
    case "street": case "sixLine": return `${k} ${n[0]}–${n[n.length - 1]}`;
    case "corner": return `${k} ${n.join("/")}`;
    case "trio": case "firstFour": case "basket": return `${k} ${n.map(pocketLabel).join("-")}`;
    case "dozen": {
      const d = Math.ceil(n[0] / 12) - 1;
      return locale === "he" ? `${k} ${ORD.he[d]} (${n[0]}–${n[11]})` : `${ORD.en[d]} 12`;
    }
    case "column": {
      const c = ((n[0] - 1) % 3);
      return locale === "he" ? `${k} ${ORD.he[c]}` : `Column ${c + 1}`;
    }
    default: return k;
  }
}
