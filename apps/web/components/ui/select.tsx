import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  tone?: "default" | "soft";
}

export function Select({ className, tone = "default", ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-tile border px-4 text-sm text-ink transition duration-200 ease-fluent outline-none focus:border-moss/65 focus:ring-4 focus:ring-moss/12 disabled:cursor-not-allowed disabled:opacity-60",
        tone === "default" && "border-line/55 bg-paper/92",
        tone === "soft" && "border-line/50 bg-sand/40",
        className
      )}
      {...props}
    />
  );
}
