import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Label({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-medium uppercase tracking-wide text-muted", className)} {...p} />;
}

/** Inputs use 16px text so iOS Safari does not zoom on focus. */
export function Input({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-foreground outline-none focus:border-gold/60", className)} {...p} />;
}

export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-foreground outline-none focus:border-gold/60", className)} {...p}>
      {children}
    </select>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Progress({ value, className, tone = "gold" }: { value: number; className?: string; tone?: "gold" | "good" | "danger" | "warn" }) {
  const color = { gold: "bg-gold", good: "bg-good", danger: "bg-danger", warn: "bg-warn" }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/10", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function Stat({ label, value, sub, tone, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "good" | "danger" | "warn" | "gold"; className?: string }) {
  const color = tone ? { good: "text-good", danger: "text-danger", warn: "text-warn", gold: "text-gold-strong" }[tone] : "text-foreground";
  return (
    <div className={cn("rounded-xl border border-border bg-surface-2/60 p-3", className)}>
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold tabular-nums", color)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}
