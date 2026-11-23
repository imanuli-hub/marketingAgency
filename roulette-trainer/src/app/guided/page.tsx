import type { Metadata } from "next";
import { GuidedPractice } from "./guided-practice";

export const metadata: Metadata = { title: "Guided Practice" };
export default function Page() { return <GuidedPractice />; }
