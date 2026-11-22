import type { Metadata } from "next";
import { CasinoSession } from "./casino-session";

export const metadata: Metadata = { title: "Casino Rehearsal" };
export default function Page() { return <CasinoSession />; }
