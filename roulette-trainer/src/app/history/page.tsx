import type { Metadata } from "next";
import { SessionHistory } from "./session-history";

export const metadata: Metadata = { title: "Session History" };
export default function Page() { return <SessionHistory />; }
