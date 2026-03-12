import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/eyebrow";

interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  heading: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "default" | "inverse";
  titleTag?: "h1" | "h2" | "h3";
}

export function SectionHeading({
  align = "left",
  className,
  description,
  heading,
  eyebrow,
  tone = "default",
  titleTag = "h2",
  ...props
}: SectionHeadingProps) {
  const TitleTag = titleTag;

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className
      )}
      {...props}
    >
      {eyebrow ? (
        <Eyebrow className={cn(tone === "inverse" && "text-paper/72")}>{eyebrow}</Eyebrow>
      ) : null}
      <div className="space-y-3">
        <TitleTag
          className={cn(
            "text-4xl leading-none sm:text-5xl",
            tone === "default" && "text-dusk",
            tone === "inverse" && "text-paper"
          )}
        >
          {heading}
        </TitleTag>
        {description ? (
          <div
            className={cn(
              "max-w-3xl text-base leading-7",
              tone === "default" && "text-ink/74",
              tone === "inverse" && "text-paper/76"
            )}
          >
            {description}
          </div>
        ) : null}
      </div>
    </div>
  );
}
