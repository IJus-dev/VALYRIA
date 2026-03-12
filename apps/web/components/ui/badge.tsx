import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "neutral";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-eyebrow",
        variant === "default" && "bg-moss text-paper",
        variant === "outline" && "border border-line/55 bg-paper/72 text-dusk",
        variant === "neutral" && "bg-dusk/8 text-dusk",
        className
      )}
      {...props}
    />
  );
}
