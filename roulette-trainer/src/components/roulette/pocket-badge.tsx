import { pocketColor, pocketLabel, type Pocket } from "@/lib/roulette/wheel";
import { cn } from "@/lib/utils/cn";

const BG = { red: "bg-pocket-red", black: "bg-pocket-black border border-white/15", green: "bg-pocket-green" } as const;

export function PocketBadge({ pocket, className, size = "md" }: { pocket: Pocket; className?: string; size?: "sm" | "md" | "lg" }) {
  const s = { sm: "size-7 text-xs", md: "size-9 text-sm", lg: "size-16 text-2xl" }[size];
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white tabular-nums shadow", BG[pocketColor(pocket)], s, className)}>
      {pocketLabel(pocket)}
    </span>
  );
}
