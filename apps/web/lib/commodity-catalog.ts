import type { LucideIcon } from "lucide-react";
import {
  Bean,
  Candy,
  Coffee,
  Flower2,
  Leaf,
  Sprout,
  Wheat,
} from "lucide-react";

export interface CommodityMeta {
  code: string;
  name: string;
  description: string;
  unit: string;
  icon: LucideIcon;
  emoji: string;
  accentTone: "moss" | "clay";
}

export const COMMODITY_CATALOG: Record<string, CommodityMeta> = {
  MLH: {
    code: "MLH",
    name: "Milho",
    description: "Milho em grão, base do agronegócio brasileiro.",
    unit: "sacas de 60kg",
    icon: Wheat,
    emoji: "\u{1F33D}",
    accentTone: "clay",
  },
  SOJ: {
    code: "SOJ",
    name: "Soja",
    description: "Principal commodity de exportação do Brasil.",
    unit: "sacas de 60kg",
    icon: Leaf,
    emoji: "\u{1F33F}",
    accentTone: "moss",
  },
  ARZ: {
    code: "ARZ",
    name: "Arroz",
    description: "Arroz em casca, base alimentar do mercado interno.",
    unit: "sacas de 50kg",
    icon: Sprout,
    emoji: "\u{1F33E}",
    accentTone: "moss",
  },
  CAF: {
    code: "CAF",
    name: "Café",
    description: "Café arábica e robusta, destaque na exportação.",
    unit: "sacas de 60kg",
    icon: Coffee,
    emoji: "\u{2615}",
    accentTone: "clay",
  },
  FEJ: {
    code: "FEJ",
    name: "Feijão",
    description: "Feijão carioca e preto, consumo doméstico intenso.",
    unit: "sacas de 60kg",
    icon: Bean,
    emoji: "\u{1FAD8}",
    accentTone: "clay",
  },
  TRG: {
    code: "TRG",
    name: "Trigo",
    description: "Trigo nacional, base para panificação e massas.",
    unit: "sacas de 60kg",
    icon: Wheat,
    emoji: "\u{1F33E}",
    accentTone: "moss",
  },
  ACR: {
    code: "ACR",
    name: "Açúcar",
    description: "Açúcar cristal e VHP, exportação e energia.",
    unit: "toneladas",
    icon: Candy,
    emoji: "\u{1F36C}",
    accentTone: "clay",
  },
  ALG: {
    code: "ALG",
    name: "Algodão",
    description: "Algodão em pluma, fibra de alta demanda global.",
    unit: "arrobas de 15kg",
    icon: Flower2,
    emoji: "\u{1F3F5}",
    accentTone: "moss",
  },
};

export function getCommodityFromAlias(
  alias: string
): CommodityMeta | undefined {
  const code = alias.split(".")[0] ?? "";
  return COMMODITY_CATALOG[code];
}

export function parseSeriesAlias(alias: string): {
  commodity: string;
  region: string;
  year: string;
  cycle: string;
  grade: string;
  lotUnit: string;
  sequence: string;
} | null {
  const parts = alias.split(".");
  if (parts.length < 7) return null;
  const [commodity, region, year, cycle, grade, lotUnit, sequence] = parts as [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  return { commodity, region, year, cycle, grade, lotUnit, sequence };
}

const REGION_NAMES: Record<string, string> = {
  MT: "Mato Grosso",
  GO: "Goiás",
  RS: "Rio Grande do Sul",
  MG: "Minas Gerais",
  PR: "Paraná",
  SP: "São Paulo",
  BA: "Bahia",
  MS: "Mato Grosso do Sul",
  TO: "Tocantins",
  MA: "Maranhão",
  PI: "Piauí",
  SC: "Santa Catarina",
};

export function getRegionName(code: string): string {
  return REGION_NAMES[code] ?? code;
}
