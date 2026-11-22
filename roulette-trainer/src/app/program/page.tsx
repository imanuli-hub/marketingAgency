import type { Metadata } from "next";
import { ProgramOverview } from "./program-overview";

export const metadata: Metadata = { title: "14-Day Program" };
export default function Page() { return <ProgramOverview />; }
