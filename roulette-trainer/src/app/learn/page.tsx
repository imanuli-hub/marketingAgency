import type { Metadata } from "next";
import { BetsGuide } from "./bets-guide";

export const metadata: Metadata = { title: "Bets & Odds" };
export default function Page() { return <BetsGuide />; }
