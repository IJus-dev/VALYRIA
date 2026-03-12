import type { Locale, Dictionary } from "../types";
import { en } from "./en";
import { ptBR } from "./pt-BR";

const dictionaries: Record<Locale, Dictionary> = { en, "pt-BR": ptBR };

export function getWebDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}
