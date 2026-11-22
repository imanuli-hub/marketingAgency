import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] touch-manipulation select-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-gold-strong to-gold text-black shadow-[0_4px_20px_-6px_rgba(214,178,94,0.6)] hover:brightness-110",
        secondary: "bg-surface-2 text-foreground border border-border hover:border-gold/50",
        outline: "border border-gold/40 text-gold-strong hover:bg-gold/10",
        ghost: "text-muted hover:text-foreground hover:bg-white/5",
        danger: "bg-danger/90 text-white hover:bg-danger",
        felt: "bg-felt text-white border border-white/10 hover:brightness-110",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
export { buttonVariants };
