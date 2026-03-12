"use client";
import { useLocale } from "@/lib/locale-context";

export function LangToggle() {
  const { locale, setLocale } = useLocale();
  const next = locale === "en" ? "pt-BR" : "en";
  return (
    <button
      onClick={() => setLocale(next)}
      className="rounded-pill border border-line/55 bg-paper/82 px-3 py-2 text-sm text-dusk transition hover:border-line/70"
    >
      {next === "pt-BR" ? "PT-BR" : "EN"}
    </button>
  );
}
