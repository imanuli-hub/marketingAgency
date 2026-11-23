import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// Hebrew text falls back to the system UI font (SF Hebrew on iPhone), which renders it cleanly.
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Roulette Academy — Training Simulator", template: "%s · Roulette Academy" },
  description: "Learn roulette rules, odds, strategies and bankroll management with virtual money. A training simulator — no real-money gambling.",
  applicationName: "Roulette Academy",
  appleWebApp: { capable: true, title: "Roulette Academy", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#07100c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${inter.variable} ${playfair.variable} dark antialiased`} suppressHydrationWarning>
      <body className="font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
