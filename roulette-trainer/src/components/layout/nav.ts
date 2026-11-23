import { BarChart3, BookOpen, CalendarCheck, ClipboardCheck, Dices, FlaskConical, GraduationCap, Home, Landmark, Settings, TrendingUp } from "lucide-react";
import type { MessageKey } from "@/lib/i18n";

export const NAV: { href: string; label: MessageKey; short: MessageKey; icon: typeof Home }[] = [
  { href: "/", label: "nav.dashboard", short: "nav.short.home", icon: Home },
  { href: "/play", label: "nav.play", short: "nav.short.play", icon: Dices },
  { href: "/guided", label: "nav.guided", short: "nav.short.guided", icon: GraduationCap },
  { href: "/program", label: "nav.program", short: "nav.short.program", icon: CalendarCheck },
  { href: "/learn", label: "nav.learn", short: "nav.short.learn", icon: BookOpen },
  { href: "/strategies", label: "nav.strategies", short: "nav.short.strategies", icon: TrendingUp },
  { href: "/simulator", label: "nav.simulator", short: "nav.short.simulator", icon: FlaskConical },
  { href: "/casino", label: "nav.casino", short: "nav.short.casino", icon: Landmark },
  { href: "/assessment", label: "nav.assessment", short: "nav.short.assessment", icon: ClipboardCheck },
  { href: "/history", label: "nav.history", short: "nav.short.history", icon: BarChart3 },
  { href: "/settings", label: "nav.settings", short: "nav.short.settings", icon: Settings },
];

export const MOBILE_PRIMARY = ["/", "/play", "/program", "/simulator"];
