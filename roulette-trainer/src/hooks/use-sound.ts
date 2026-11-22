"use client";
import { useCallback, useRef } from "react";
import { useAppStore } from "@/store/app-store";

type Sfx = "chip" | "spin" | "drop" | "win" | "lose" | "bell";

/** Tiny synthesized sound effects (no audio files, works offline). */
export function useSound() {
  const enabled = useAppStore((s) => s.settings.sound);
  const ctxRef = useRef<AudioContext | null>(null);

  return useCallback(
    (kind: Sfx) => {
      if (!enabled || typeof window === "undefined") return;
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = (ctxRef.current ??= new AC());
      if (ctx.state === "suspended") void ctx.resume();
      const t = ctx.currentTime;
      const tone = (freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.12) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t + start);
        g.gain.setValueAtTime(0.0001, t + start);
        g.gain.exponentialRampToValueAtTime(vol, t + start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
        o.connect(g).connect(ctx.destination);
        o.start(t + start);
        o.stop(t + start + dur + 0.02);
      };
      switch (kind) {
        case "chip": tone(1800, 0, 0.05, "triangle", 0.08); tone(2600, 0.02, 0.04, "triangle", 0.05); break;
        case "spin": for (let i = 0; i < 18; i++) tone(900 + (i % 3) * 120, i * 0.09 + i * i * 0.004, 0.03, "square", 0.025); break;
        case "drop": [0, 0.12, 0.2, 0.26].forEach((s, i) => tone(1300 - i * 120, s, 0.05, "triangle", 0.07)); break;
        case "win": [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, "sine", 0.1)); break;
        case "lose": tone(220, 0, 0.3, "sine", 0.06); break;
        case "bell": tone(1320, 0, 0.6, "sine", 0.1); tone(1980, 0, 0.4, "sine", 0.04); break;
      }
    },
    [enabled],
  );
}
