export { Eraser, RotateCcw, Undo2 } from "lucide-react";
import type { SVGProps } from "react";

/** "×2" double icon. */
export function X2(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M4 7l6 6M10 7l-6 6" />
      <path d="M14 9a3 3 0 1 1 5 2.2L14 17h6" />
    </svg>
  );
}
