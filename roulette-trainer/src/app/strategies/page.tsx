import type { Metadata } from "next";
import { StrategyLab } from "./strategy-lab";

export const metadata: Metadata = { title: "Strategy Lab" };
export default function Page() { return <StrategyLab />; }
