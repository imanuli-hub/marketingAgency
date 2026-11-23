import type { Metadata } from "next";
import { Assessment } from "./assessment";

export const metadata: Metadata = { title: "Final Assessment" };
export default function Page() { return <Assessment />; }
