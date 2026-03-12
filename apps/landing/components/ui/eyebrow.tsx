import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "moss" | "clay" | "ink";
}

export function Eyebrow({ className, tone = "moss", ...props }: EyebrowProps) {
  return (
    <span
      className={cn(
        "text-xs font-semibold uppercase tracking-brand",
        tone === "moss" && "text-moss/85",
        tone === "clay" && "text-clay/85",
        tone === "ink" && "text-ink/70",
        className
      )}
      {...props}
    />
  );
}
