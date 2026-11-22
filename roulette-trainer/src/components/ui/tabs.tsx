"use client";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn("inline-flex max-w-full overflow-x-auto rounded-xl border border-border bg-surface p-1 gap-1 [scrollbar-width:none]", className)} {...p} />;
}
export function TabsTrigger({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn("shrink-0 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors data-[state=active]:bg-gold/15 data-[state=active]:text-gold-strong hover:text-foreground touch-manipulation", className)}
      {...p}
    />
  );
}
export function TabsContent({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-4 outline-none", className)} {...p} />;
}
