import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROGRAM } from "@/lib/content/program";
import { DayLesson } from "./day-lesson";

export function generateStaticParams() {
  return PROGRAM.map((d) => ({ day: String(d.day) }));
}

export async function generateMetadata({ params }: PageProps<"/program/[day]">): Promise<Metadata> {
  const { day } = await params;
  const d = PROGRAM[Number(day) - 1];
  return { title: d ? `Day ${d.day}: ${d.title}` : "Program" };
}

export default async function Page({ params }: PageProps<"/program/[day]">) {
  const { day } = await params;
  const n = Number(day);
  if (!PROGRAM[n - 1]) notFound();
  return <DayLesson day={n} />;
}
