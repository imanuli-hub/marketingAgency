import { BarChart3, BookOpen, CalendarCheck, Dices, FlaskConical, Home, Landmark, Settings, TrendingUp } from "lucide-react";

export const NAV = [
  { href: "/", label: "Dashboard", short: "Home", icon: Home },
  { href: "/play", label: "Practice Table", short: "Play", icon: Dices },
  { href: "/learn", label: "Bets & Odds", short: "Learn", icon: BookOpen },
  { href: "/strategies", label: "Strategy Lab", short: "Strategies", icon: TrendingUp },
  { href: "/simulator", label: "Simulator", short: "Simulate", icon: FlaskConical },
  { href: "/program", label: "14-Day Program", short: "Program", icon: CalendarCheck },
  { href: "/casino", label: "Casino Ready", short: "Casino", icon: Landmark },
  { href: "/history", label: "Session History", short: "History", icon: BarChart3 },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings },
] as const;

export const MOBILE_PRIMARY = ["/", "/play", "/program", "/simulator"];
