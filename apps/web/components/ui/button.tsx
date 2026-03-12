import type { ButtonHTMLAttributes } from "react";
import type { ComponentProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

function buttonClasses(variant: ButtonVariant = "default", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition duration-200 ease-fluent focus:outline-none focus:ring-4 focus:ring-moss/12 disabled:cursor-not-allowed disabled:opacity-60",
    size === "sm" && "min-h-10 px-4 text-sm",
    size === "md" && "min-h-12 px-5 text-sm",
    size === "lg" && "min-h-14 px-6 text-base",
    variant === "default" && "bg-dusk text-paper shadow-panel hover:bg-moss",
    variant === "secondary" && "bg-clay text-paper shadow-panel hover:bg-dusk",
    variant === "ghost" && "border border-line/55 bg-paper/74 text-dusk hover:bg-paper/92",
    className
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "default",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function ButtonLink({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}
