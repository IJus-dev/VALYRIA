export type Locale = "en" | "pt-BR";
export type Dictionary = Record<string, string>;

export function t(dict: Dictionary, key: string): string {
  return dict[key] ?? key;
}

