"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";
import { fmtMoney } from "@/lib/utils/format";
import { MOBILE_PRIMARY, NAV } from "./nav";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="#13804b" stroke="#d6b25e" strokeWidth="1.5" />
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M16 16 L16 2.5 A13.5 13.5 0 0 1 22.75 4.31 Z" fill={i % 2 ? "#17191b" : "#b3202a"} transform={`rotate(${i * 30} 16 16)`} />
        ))}
        <circle cx="16" cy="16" r="7" fill="#3b2112" stroke="#d6b25e" />
        <circle cx="16" cy="16" r="2" fill="#f0cf7a" />
      </svg>
      <div className="leading-tight">
        <div className="font-display text-base gold-text">Roulette Academy</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted">Training simulator</div>
      </div>
    </Link>
  );
}

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function AppShell({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [more, setMore] = useState(false);
  const path = usePathname();
  const bankroll = useAppStore((s) => s.bankroll);

  useEffect(() => {
    void Promise.resolve(useAppStore.persist.rehydrate()).then(() => setHydrated(true));
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface/60 p-4 backdrop-blur lg:flex">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors", isActive(path, href) ? "bg-gold/15 text-gold-strong" : "text-muted hover:bg-white/5 hover:text-foreground")}>
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-border bg-black/30 p-3 text-xs text-muted">
          <div className="flex items-center gap-1.5 text-good"><ShieldCheck className="size-3.5" /> Virtual money only</div>
          <p className="mt-1">No real-money betting. Roulette has a built-in house edge that no system overcomes.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/85 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-md lg:hidden">
          <Logo />
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted">Virtual bankroll</div>
            <div className="font-semibold tabular-nums text-gold-strong">{hydrated ? fmtMoney(bankroll) : "—"}</div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {hydrated ? children : (
            <div className="grid min-h-[50dvh] place-items-center text-muted">
              <div className="size-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" aria-label="Loading" />
            </div>
          )}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden" aria-label="Main">
        {NAV.filter((n) => MOBILE_PRIMARY.includes(n.href)).map(({ href, short, icon: Icon }) => (
          <Link key={href} href={href} className={cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] touch-manipulation", isActive(path, href) ? "text-gold-strong" : "text-muted")}>
            <Icon className="size-5" /> {short}
          </Link>
        ))}
        <button onClick={() => setMore(true)} className={cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] touch-manipulation", !MOBILE_PRIMARY.some((h) => isActive(path, h) && h !== "/") && path !== "/" ? "text-gold-strong" : "text-muted")}>
          <MoreHorizontal className="size-5" /> More
        </button>
      </nav>
      <Dialog open={more} onOpenChange={setMore}>
        <DialogContent className="top-auto bottom-0 translate-y-0 rounded-b-none pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
          <DialogTitle>All sections</DialogTitle>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMore(false)} className={cn("flex items-center gap-2 rounded-xl border border-border p-3 text-sm", isActive(path, href) ? "border-gold/50 text-gold-strong" : "text-foreground")}>
                <Icon className="size-4 text-gold" /> {label}
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
