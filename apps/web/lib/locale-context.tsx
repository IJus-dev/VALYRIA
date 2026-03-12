"use client";
import { createContext, useContext, useCallback, type ReactNode } from "react";
import type { Locale } from "@valyria/i18n";
import { DEFAULT_LOCALE } from "@valyria/i18n";
import { getWebDictionary } from "@valyria/i18n/web";

type TranslateFn = (key: string) => string;

type LocaleContextValue = {
  locale: Locale;
  t: TranslateFn;
  setLocale: (l: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: (key) => key,
  setLocale: () => {},
});

export function LocaleProvider({
  locale: initialLocale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const dict = getWebDictionary(initialLocale);
  const t: TranslateFn = useCallback(
    (key: string) => dict[key] ?? key,
    [dict],
  );

  const setLocale = (l: Locale) => {
    document.cookie = `NEXT_LOCALE=${l};path=/;max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  };

  return (
    <LocaleContext.Provider value={{ locale: initialLocale, t, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
