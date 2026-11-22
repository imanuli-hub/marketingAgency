"use client";
import { useMemo, useRef, useState, type PointerEvent } from "react";
import type { BetSpec, PlacedBet } from "@/lib/roulette/bets";
import { LAYOUT_BOUNDS, anchorFor, hitTest, layoutCells, orient, orientRect, unorient, type Orientation } from "@/lib/roulette/layout";
import type { Pocket, WheelType } from "@/lib/roulette/wheel";
import { ChipGlyph } from "./chip";
import { cn } from "@/lib/utils/cn";

const UNITS: Record<Orientation, { ux: number; uy: number }> = {
  horizontal: { ux: 60, uy: 64 },
  vertical: { ux: 70, uy: 44 },
};
const FILL = { red: "#b3202a", black: "#17191b", green: "#13804b", felt: "transparent" } as const;
const SNAP_PX = 13;

export interface BettingTableProps {
  wheel: WheelType;
  orientation: Orientation;
  bets?: readonly PlacedBet[];
  onPlace?: (spec: BetSpec) => void;
  onRemove?: (spec: BetSpec) => void;
  /** Numbers to highlight (e.g. tutorial demonstration). */
  highlight?: readonly number[];
  winning?: Pocket | null;
  /** Keys of bets that won on the last spin. */
  winningKeys?: readonly string[];
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function BettingTable({
  wheel, orientation, bets = [], onPlace, onRemove, highlight, winning, winningKeys, disabled, className, ariaLabel,
}: BettingTableProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const down = useRef<{ x: number; y: number; t: number } | null>(null);
  const [hover, setHover] = useState<BetSpec | null>(null);
  const { ux, uy } = UNITS[orientation];
  const bounds = LAYOUT_BOUNDS[orientation];
  const W = (bounds.x1 - bounds.x0) * ux;
  const H = (bounds.y1 - bounds.y0) * uy;
  const cells = useMemo(() => layoutCells(wheel), [wheel]);

  // pixels along the horizontal-model axes
  const pxModelX = orientation === "horizontal" ? ux : uy;
  const pxModelY = orientation === "horizontal" ? uy : ux;

  const toPx = (p: { x: number; y: number }) => {
    const o = orient(p, orientation);
    return { x: (o.x - bounds.x0) * ux, y: (o.y - bounds.y0) * uy };
  };

  const fromEvent = (e: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const o = { x: pt.x / ux + bounds.x0, y: pt.y / uy + bounds.y0 };
    return hitTest(unorient(o, orientation), wheel, SNAP_PX / pxModelX, SNAP_PX / pxModelY);
  };

  const highlighted = useMemo(() => new Set(hover?.numbers ?? highlight ?? []), [hover, highlight]);
  const interactive = !!onPlace && !disabled;

  return (
    <div className={cn("felt-bg relative w-full rounded-2xl border-[3px] border-[#5a3a1c] p-2 shadow-[inset_0_0_40px_rgba(0,0,0,0.5),0_20px_40px_-20px_rgba(0,0,0,0.9)]", className)}>
      <svg
        ref={svgRef}
        viewBox={`-4 -4 ${W + 8} ${H + 8}`}
        className={cn("block h-auto w-full select-none touch-manipulation", interactive && "cursor-pointer")}
        role="group"
        aria-label={ariaLabel ?? "Roulette betting layout"}
        onPointerDown={(e) => { down.current = { x: e.clientX, y: e.clientY, t: Date.now() }; }}
        onPointerUp={(e) => {
          if (!interactive || !down.current) return;
          const moved = Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y);
          down.current = null;
          if (moved > 10 || e.button === 2) return; // scrolling or right click
          const spec = fromEvent(e);
          if (spec) onPlace!(spec);
        }}
        onPointerMove={(e) => { if (e.pointerType === "mouse" && interactive) setHover(fromEvent(e)); }}
        onPointerLeave={() => setHover(null)}
        onContextMenu={(e) => {
          if (!onRemove) return;
          e.preventDefault();
          const spec = fromEvent(e as unknown as PointerEvent<SVGSVGElement>);
          if (spec) onRemove(spec);
        }}
      >
        {cells.map((cell) => {
          const r = orientRect(cell.rect, orientation);
          const x = (r.x0 - bounds.x0) * ux, y = (r.y0 - bounds.y0) * uy;
          const w = (r.x1 - r.x0) * ux, h = (r.y1 - r.y0) * uy;
          const isNumber = cell.spec.kind === "straight";
          const n = cell.spec.numbers[0];
          const lit = isNumber ? highlighted.has(n) : hover?.key === cell.spec.key;
          const won = isNumber && winning === n;
          const isColorCell = cell.spec.kind === "red" || cell.spec.kind === "black";
          return (
            <g key={cell.spec.key}>
              <rect x={x} y={y} width={w} height={h} fill={FILL[cell.fill]} stroke="#e9dcb4" strokeOpacity="0.75" strokeWidth="1.2" />
              {isColorCell && (
                <path
                  d={`M ${x + w / 2} ${y + h * 0.22} L ${x + w * 0.8} ${y + h / 2} L ${x + w / 2} ${y + h * 0.78} L ${x + w * 0.2} ${y + h / 2} Z`}
                  fill={cell.spec.kind === "red" ? FILL.red : FILL.black}
                  stroke="#e9dcb4"
                  strokeOpacity="0.6"
                />
              )}
              {lit && <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx="4" fill="#f6dc8f" fillOpacity="0.28" stroke="#f6dc8f" strokeWidth="2" />}
              {won && <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} rx="4" fill="none" stroke="#fff6cf" strokeWidth="3" style={{ filter: "drop-shadow(0 0 6px #f6dc8f)" }} />}
              {!isColorCell && (
                <text
                  x={x + w / 2}
                  y={y + h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize={isNumber ? 17 : cell.label.length > 5 ? 12 : 14}
                  fontWeight={isNumber ? 700 : 600}
                  letterSpacing={isNumber ? 0 : 0.5}
                  style={{ fontFamily: "var(--font-sans)", pointerEvents: "none" }}
                >
                  {cell.label}
                </text>
              )}
              {won && (
                <g transform={`translate(${x + w / 2} ${y + h / 2 - (orientation === "vertical" ? 0 : 18)})`} aria-hidden>
                  <ellipse cy="10" rx="9" ry="3" fill="#000" opacity="0.35" />
                  <path d="M -7 8 L -5 -6 L 5 -6 L 7 8 Z" fill="#e8f3ff" fillOpacity="0.85" stroke="#9cc2e6" />
                  <circle cy="-8" r="5" fill="#e8f3ff" stroke="#9cc2e6" />
                </g>
              )}
            </g>
          );
        })}

        {hover && hover.kind !== "straight" && !["dozen", "column", "red", "black", "odd", "even", "low", "high"].includes(hover.kind) && (() => {
          const p = toPx(anchorFor(hover, wheel));
          return <circle cx={p.x} cy={p.y} r="9" fill="#f6dc8f" fillOpacity="0.5" stroke="#fff" strokeWidth="1.5" pointerEvents="none" />;
        })()}

        {bets.map((b) => {
          const p = toPx(anchorFor(b, wheel));
          const won = winningKeys?.includes(b.key);
          return (
            <g key={b.key} transform={`translate(${p.x} ${p.y})`} pointerEvents="none" style={{ filter: won ? "drop-shadow(0 0 8px #f6dc8f)" : "drop-shadow(0 2px 2px rgba(0,0,0,0.6))" }}>
              <ChipGlyph amount={b.amount} r={orientation === "vertical" ? 13 : 15} stack={Math.ceil(Math.log10(b.amount + 1))} />
            </g>
          );
        })}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-lg bg-black/75 px-2.5 py-1 text-xs text-gold-strong">
          {hover.label} · pays {hover.payout}:1
        </div>
      )}
    </div>
  );
}
