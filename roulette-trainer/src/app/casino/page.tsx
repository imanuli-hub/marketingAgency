import type { Metadata } from "next";
import { CasinoGuide } from "./casino-guide";

export const metadata: Metadata = { title: "Casino Ready" };
export default function Page() { return <CasinoGuide />; }
