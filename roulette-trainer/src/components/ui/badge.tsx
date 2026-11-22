import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border", {
  variants: {
    variant: {
      default: "border-gold/40 text-gold-strong bg-gold/10",
      muted: "border-border text-muted bg-white/5",
      good: "border-good/40 text-good bg-good/10",
      warn: "border-warn/40 text-warn bg-warn/10",
      danger: "border-danger/40 text-danger bg-danger/10",
      info: "border-info/40 text-info bg-info/10",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...p }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...p} />;
}
