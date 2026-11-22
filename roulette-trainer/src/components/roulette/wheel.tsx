"use client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { animate, useMotionValue, type AnimationPlaybackControls } from "framer-motion";
import { pocketColor, pocketLabel, wheelOrder, type Pocket, type WheelType } from "@/lib/roulette/wheel";
import { cn } from "@/lib/utils/cn";

const R_TRACK = 176;
const R_POCKET = 124;
const R_NUM_OUT = 160;
const R_NUM_IN = 134;
const R_POCKET_IN = 112;

const COLORS = { red: "#b3202a", black: "#17191b", green: "#13804b" } as const;

function wedge(r0: number, r1: number, a0: number, a1: number) {
  const rad = (a: number) => ((a - 90) * Math.PI) / 180;
  const p = (r: number, a: number) => `${(r * Math.cos(rad(a))).toFixed(3)} ${(r * Math.sin(rad(a))).toFixed(3)}`;
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}

export interface WheelProps {
  wheel: WheelType;
  /** Result decided by the engine. The animation lands exactly here. */
  result: Pocket | null;
  /** Increment to start a spin towards `result`. */
  spinId: number;
  reduced: boolean;
  onSettled?: () => void;
  highlight?: Pocket | null;
  className?: string;
}

export function RouletteWheel({ wheel, result, spinId, reduced, onSettled, highlight, className }: WheelProps) {
  const order = wheelOrder(wheel);
  const N = order.length;
  const step = 360 / N;
  const wheelRot = useMotionValue(0);
  const ballRel = useMotionValue(0);
  const ballR = useMotionValue(R_POCKET);
  const gRef = useRef<SVGGElement>(null);
  const ballRef = useRef<SVGGElement>(null);
  const idle = useRef<AnimationPlaybackControls | null>(null);
  const settledCb = useRef(onSettled);
  useEffect(() => { settledCb.current = onSettled; }, [onSettled]);

  // Imperatively sync SVG transforms (cheap, no React re-render per frame).
  useEffect(() => {
    const paint = () => {
      gRef.current?.setAttribute("transform", `rotate(${wheelRot.get()})`);
      const a = (ballRel.get() * Math.PI) / 180;
      const r = ballR.get();
      ballRef.current?.setAttribute("transform", `translate(${(Math.sin(a) * r).toFixed(2)} ${(-Math.cos(a) * r).toFixed(2)})`);
    };
    paint();
    const subs = [wheelRot.on("change", paint), ballRel.on("change", paint), ballR.on("change", paint)];
    return () => subs.forEach((u) => u());
  }, [wheelRot, ballRel, ballR]);

  const startIdle = useCallback(() => {
    idle.current?.stop();
    if (reduced) return;
    idle.current = animate(wheelRot, wheelRot.get() + 360, { duration: 40, ease: "linear", repeat: Infinity });
  }, [reduced, wheelRot]);
  const startIdleRef = useRef(startIdle);
  useEffect(() => {
    startIdleRef.current = startIdle;
    startIdle();
    return () => idle.current?.stop();
  }, [startIdle]);

  useEffect(() => {
    if (!spinId || result === null) return;
    const i = order.indexOf(result);
    if (i < 0) return;
    idle.current?.stop();
    const target = i * step;
    const rel0 = ballRel.get();
    const turns = reduced ? 1 : 9;
    const rel1 = target + 360 * Math.floor((rel0 - 360 * turns - target) / 360);
    const dur = reduced ? 0.7 : 5.6;
    const controls = [
      animate(wheelRot, wheelRot.get() + (reduced ? 40 : 360 * 2.2), { duration: dur + (reduced ? 0 : 1.4), ease: [0.12, 0.6, 0.3, 1] }),
      animate(ballR, reduced ? [R_POCKET, R_POCKET] : [R_POCKET, R_TRACK, R_TRACK, R_POCKET + 18, R_POCKET + 4, R_POCKET], {
        duration: dur,
        times: reduced ? [0, 1] : [0, 0.06, 0.62, 0.84, 0.93, 1],
      }),
      animate(ballRel, rel1, { duration: dur, ease: [0.18, 0.55, 0.3, 1] }),
    ];
    let cancelled = false;
    controls[2].then(() => {
      if (cancelled) return;
      settledCb.current?.();
    });
    controls[0].then(() => { if (!cancelled) startIdleRef.current(); });
    return () => { cancelled = true; controls.forEach((c) => c.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  const pockets = useMemo(
    () =>
      order.map((p, i) => {
        const a0 = i * step - step / 2;
        const a1 = i * step + step / 2;
        return { p, i, a0, a1, color: COLORS[pocketColor(p)] };
      }),
    [order, step],
  );

  return (
    <div className={cn("relative aspect-square w-full", className)}>
      <svg viewBox="-200 -200 400 400" className="h-full w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]" role="img" aria-label={`${wheel === "european" ? "European single-zero" : "American double-zero"} roulette wheel${highlight != null ? `, result ${pocketLabel(highlight)}` : ""}`}>
        <defs>
          <radialGradient id="wood" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="#3b2112" />
            <stop offset="92%" stopColor="#6b3d1f" />
            <stop offset="100%" stopColor="#2a160b" />
          </radialGradient>
          <radialGradient id="track" cx="50%" cy="50%" r="50%">
            <stop offset="84%" stopColor="#1a120c" />
            <stop offset="95%" stopColor="#3a2617" />
          </radialGradient>
          <radialGradient id="cone" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#8a5a2b" />
            <stop offset="60%" stopColor="#4a2a14" />
            <stop offset="100%" stopColor="#2b170a" />
          </radialGradient>
          <linearGradient id="goldG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f6dc8f" />
            <stop offset="50%" stopColor="#c99a3e" />
            <stop offset="100%" stopColor="#8a6421" />
          </linearGradient>
          <radialGradient id="ballG" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#d9d9d9" />
            <stop offset="100%" stopColor="#8f8f8f" />
          </radialGradient>
        </defs>

        <circle r="199" fill="url(#wood)" />
        <circle r="190" fill="url(#track)" />
        <circle r="190" fill="none" stroke="url(#goldG)" strokeWidth="1.5" opacity="0.7" />
        {Array.from({ length: 8 }, (_, k) => (
          <rect key={k} x="-3" y={-171} width="6" height="10" rx="1" fill="url(#goldG)" transform={`rotate(${k * 45 + 22.5}) `} opacity="0.85" />
        ))}

        <g ref={gRef}>
          <circle r={R_NUM_OUT + 2} fill="#0b0b0b" />
          {pockets.map(({ p, i, a0, a1, color }) => (
            <g key={i}>
              <path d={wedge(R_NUM_IN, R_NUM_OUT, a0, a1)} fill={color} stroke="url(#goldG)" strokeWidth="0.6" />
              <path d={wedge(R_POCKET_IN, R_NUM_IN, a0, a1)} fill={color} opacity="0.55" stroke="#c99a3e" strokeWidth="0.8" />
              <text
                transform={`rotate(${i * step}) translate(0 ${-(R_NUM_IN + R_NUM_OUT) / 2})`}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontSize={N > 37 ? 10 : 11}
                fontWeight={600}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {pocketLabel(p)}
              </text>
            </g>
          ))}
          {highlight != null && order.indexOf(highlight) >= 0 && (
            <path
              d={wedge(R_POCKET_IN, R_NUM_OUT, order.indexOf(highlight) * step - step / 2, order.indexOf(highlight) * step + step / 2)}
              fill="none"
              stroke="#f6dc8f"
              strokeWidth="3"
              style={{ filter: "drop-shadow(0 0 6px #f6dc8f)" }}
            />
          )}
          <circle r={R_POCKET_IN} fill="url(#cone)" stroke="url(#goldG)" strokeWidth="2" />
          <circle r={70} fill="none" stroke="#c99a3e" strokeOpacity="0.35" />
          {[0, 90, 180, 270].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <rect x="-3" y="-62" width="6" height="52" rx="3" fill="url(#goldG)" />
              <circle cy="-64" r="6" fill="url(#goldG)" />
            </g>
          ))}
          <circle r="16" fill="url(#goldG)" />
          <circle r="7" fill="#f6dc8f" />
          <g ref={ballRef}>
            <circle r="7" fill="url(#ballG)" />
            <circle r="7" fill="none" stroke="#000" strokeOpacity="0.25" />
          </g>
        </g>
      </svg>
    </div>
  );
}
