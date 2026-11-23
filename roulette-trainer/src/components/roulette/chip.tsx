import { cn } from "@/lib/utils/cn";

export const CHIP_DENOMS = [1, 2, 5, 10, 25, 100, 500] as const;

const CHIP_STYLE: Record<number, { base: string; edge: string; text: string }> = {
  1: { base: "#eeeae0", edge: "#2d5fa8", text: "#1b1b1b" },
  2: { base: "#e0a526", edge: "#3a2a05", text: "#1b1b1b" },
  5: { base: "#c0262f", edge: "#ffffff", text: "#ffffff" },
  10: { base: "#1f5fbf", edge: "#ffffff", text: "#ffffff" },
  25: { base: "#178a4c", edge: "#ffffff", text: "#ffffff" },
  100: { base: "#151515", edge: "#d6b25e", text: "#f0cf7a" },
  500: { base: "#6b2fa3", edge: "#f0cf7a", text: "#ffffff" },
};

export function chipStyle(amount: number) {
  let d: number = CHIP_DENOMS[0];
  for (const c of CHIP_DENOMS) if (amount >= c) d = c;
  return CHIP_STYLE[d];
}

export const shortAmount = (x: number) =>
  x >= 1000 ? `${+(x / 1000).toFixed(x % 1000 === 0 ? 0 : 1)}k` : Number.isInteger(x) ? String(x) : x.toFixed(1);

/** SVG chip centred at (0,0) for use inside another SVG. */
export function ChipGlyph({ amount, r = 14, stack = 1 }: { amount: number; r?: number; stack?: number }) {
  const s = chipStyle(amount);
  const layers = Math.min(4, stack);
  return (
    <g>
      {Array.from({ length: layers - 1 }, (_, i) => (
        <circle key={i} cy={(layers - 1 - i) * 2.2} r={r} fill={s.base} stroke="#000" strokeOpacity="0.4" strokeWidth="0.8" />
      ))}
      <circle r={r} fill={s.base} stroke="#000" strokeOpacity="0.5" strokeWidth="0.8" />
      <circle r={r} fill="none" stroke={s.edge} strokeWidth={r * 0.28} strokeDasharray={`${r * 0.42} ${r * 0.42}`} />
      <circle r={r * 0.66} fill={s.base} stroke={s.edge} strokeOpacity="0.6" strokeWidth="0.8" />
      <text textAnchor="middle" dominantBaseline="central" fontSize={r * (shortAmount(amount).length > 3 ? 0.55 : 0.72)} fontWeight={700} fill={s.text} style={{ fontFamily: "var(--font-sans)" }}>
        {shortAmount(amount)}
      </text>
    </g>
  );
}

/** Stand-alone chip button for the chip rack. */
export function ChipButton({ value, selected, disabled, onClick, size = 48, label }: { value: number; selected?: boolean; disabled?: boolean; onClick?: () => void; size?: number; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      role="radio"
      aria-checked={!!selected}
      aria-label={label ?? String(value)}
      className={cn(
        "relative shrink-0 rounded-full transition-transform touch-manipulation disabled:opacity-30",
        selected ? "-translate-y-1.5 scale-110 drop-shadow-[0_0_10px_rgba(240,207,122,0.8)]" : "hover:-translate-y-0.5",
      )}
      style={{ width: size, height: size }}
    >
      <svg viewBox="-16 -16 32 32" className="h-full w-full">
        <ChipGlyph amount={value} r={15} />
      </svg>
      {selected && <span className="absolute -bottom-1 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-gold-strong" />}
    </button>
  );
}
