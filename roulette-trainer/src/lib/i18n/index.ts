"use client";
import { useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import type { Locale } from "@/lib/utils/format";
import { en, type MessageKey } from "./en";
import { he } from "./he";

export type { MessageKey };
export type Vars = Record<string, string | number>;
export const DICTS: Record<Locale, Record<MessageKey, string>> = { en, he };

/** Interpolate {name} placeholders. */
export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  const s = DICTS[locale][key] ?? en[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`)) : s;
}

export function useLocale(): Locale {
  return useAppStore((s) => s.settings.locale);
}

export function useT() {
  const locale = useLocale();
  return useCallback((key: MessageKey, vars?: Vars) => translate(locale, key, vars), [locale]);
}

/** Pick the right variant of localized content. */
export function pick<T>(locale: Locale, byLocale: Record<Locale, T>): T {
  return byLocale[locale] ?? byLocale.en;
}
