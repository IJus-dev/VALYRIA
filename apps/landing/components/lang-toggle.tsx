"use client";
import { useLang } from "./lang-provider";

export function LangToggle() {
  const { locale, setLocale } = useLang();
  return (
    <button
      onClick={() => setLocale(locale === "en" ? "pt-BR" : "en")}
      className="rounded-pill border border-line/45 px-2.5 py-1 text-xs font-semibold uppercase tracking-eyebrow text-dusk/70 transition hover:border-line/70 hover:text-dusk"
    >
      {locale === "en" ? "PT-BR" : "EN"}
    </button>
  );
}
