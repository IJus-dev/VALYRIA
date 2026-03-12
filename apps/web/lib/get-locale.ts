import { cookies } from "next/headers";
import type { Locale } from "@valyria/i18n";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@valyria/i18n";

export function getLocale(): Locale {
  const cookie = cookies().get("NEXT_LOCALE")?.value as Locale | undefined;
  if (cookie && SUPPORTED_LOCALES.includes(cookie)) return cookie;
  return DEFAULT_LOCALE;
}
