import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROGRAM_EN } from "@/lib/content/program.en";
import { DayLesson } from "./day-lesson";

export function generateStaticParams() {
  return PROGRAM_EN.map((d) => ({ day: String(d.day) }));
}

export async function generateMetadata({ params }: PageProps<"/program/[day]">): Promise<Metadata> {
  const { day } = await params;
  return { title: `Day ${day}` };
}

export default async function Page({ params }: PageProps<"/program/[day]">) {
  const { day } = await params;
  const n = Number(day);
  if (!PROGRAM_EN[n - 1]) notFound();
  return <DayLesson day={n} />;
}
