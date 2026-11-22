import type { Metadata } from "next";
import { PracticeTable } from "./practice-table";

export const metadata: Metadata = { title: "Practice Table" };

export default function PlayPage() {
  return <PracticeTable />;
}
