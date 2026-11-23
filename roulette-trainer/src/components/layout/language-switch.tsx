"use client";
import { Languages } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

export function LanguageSwitch({ className }: { className?: string }) {
  const locale = useAppStore((s) => s.settings.locale);
  const update = useAppStore((s) => s.updateSettings);
  const t = useT();
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-lg border border-border p-0.5 text-xs", className)} role="radiogroup" aria-label={t("a11y.language")}>
      <Languages className="mx-1 size-3.5 text-muted" aria-hidden />
      {(["he", "en"] as const).map((l) => (
        <button key={l} role="radio" aria-checked={locale === l} onClick={() => update({ locale: l })} lang={l}
          className={cn("min-h-8 min-w-9 rounded-md px-2 touch-manipulation", locale === l ? "bg-gold/20 text-gold-strong" : "text-muted hover:text-foreground")}>
          {l === "he" ? "עב" : "EN"}
        </button>
      ))}
    </div>
  );
}
