import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "default" | "soft" | "emphasis" | "outline";
}

export function Card({ className, tone = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-panel border shadow-panel backdrop-blur",
        tone === "default" && "border-line/45 bg-paper/70",
        tone === "soft" && "border-line/40 bg-paper/90",
        tone === "emphasis" && "border-dusk/20 bg-dusk text-paper shadow-hero",
        tone === "outline" && "border-line/45 bg-transparent shadow-none",
        className
      )}
      {...props}
    />
  );
}
