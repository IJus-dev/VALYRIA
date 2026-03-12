import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  tone?: "default" | "soft";
}

export function Input({ className, tone = "default", ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-tile border px-4 text-sm text-ink transition duration-200 ease-fluent outline-none placeholder:text-ink/42 focus:border-moss/65 focus:ring-4 focus:ring-moss/12 disabled:cursor-not-allowed disabled:opacity-60",
        tone === "default" && "border-line/55 bg-paper/92",
        tone === "soft" && "border-line/50 bg-sand/40",
        className
      )}
      {...props}
    />
  );
}
