import type { Metadata } from "next";
import { SimulatorLab } from "./simulator-lab";

export const metadata: Metadata = { title: "Strategy Simulator" };
export default function Page() { return <SimulatorLab />; }
