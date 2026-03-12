import type { Locale } from "./types";

export function formatNumber(value: number, locale: Locale): string {
  return value.toLocaleString(locale);
}

export function formatCurrency(value: number, locale: Locale): string {
  return `R$ ${value.toLocaleString(locale, { minimumFractionDigits: 2 })}`;
}

export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
