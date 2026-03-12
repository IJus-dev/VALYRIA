"use client";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Locale } from "@valyria/i18n";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@valyria/i18n";
import { getLandingDictionary } from "@valyria/i18n/landing";

type TranslateFn = (key: string) => string;

type LangContextValue = {
  locale: Locale;
  t: TranslateFn;
  setLocale: (l: Locale) => void;
};

const defaultDict = getLandingDictionary(DEFAULT_LOCALE);

const LangContext = createContext<LangContextValue>({
  locale: DEFAULT_LOCALE,
  t: (key) => defaultDict[key] ?? key,
  setLocale: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = localStorage.getItem("VALYRIA_LOCALE") as Locale | null;
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("VALYRIA_LOCALE", l);
    document.documentElement.lang = l;
  };

  const dict = getLandingDictionary(locale);
  const t: TranslateFn = useCallback((key: string) => dict[key] ?? key, [dict]);

  return (
    <LangContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
