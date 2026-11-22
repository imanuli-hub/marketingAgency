"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useAppStore } from "@/store/app-store";

/** True when animations should be minimised (user setting or OS preference). */
export function useMotionReduced(): boolean {
  const pref = useAppStore((s) => s.settings.motion);
  const system = useReducedMotion();
  return pref === "reduced" || (pref === "system" && !!system);
}

export function useMediaQuery(q: string): boolean {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [q]);
  return match;
}

/** Ticks every `ms` so timers re-render. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, ms);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [ms]);
  return now;
}
