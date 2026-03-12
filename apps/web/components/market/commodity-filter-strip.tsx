"use client";

import { COMMODITY_CATALOG } from "@/lib/commodity-catalog";
import { cn } from "@/lib/utils";

interface CommodityFilterStripProps {
  commodityCounts: Record<string, number>;
  selected: string | null;
  onSelect: (code: string | null) => void;
}

export function CommodityFilterStrip({
  commodityCounts,
  selected,
  onSelect,
}: CommodityFilterStripProps) {
  const totalCount = Object.values(commodityCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const activeCommodities = Object.entries(commodityCounts).filter(
    ([, count]) => count > 0
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center gap-2 rounded-pill border px-4 py-2 text-sm font-medium whitespace-nowrap transition duration-200 ease-fluent cursor-pointer",
          selected === null
            ? "bg-moss text-paper border-moss"
            : "border-line/55 bg-paper/72 text-dusk hover:bg-paper/90 hover:border-line/70"
        )}
      >
        Todos ({totalCount})
      </button>

      {activeCommodities.map(([code, count]) => {
        const meta = COMMODITY_CATALOG[code];
        if (!meta) return null;

        const Icon = meta.icon;
        const isActive = selected === code;

        return (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            className={cn(
              "flex items-center gap-2 rounded-pill border px-4 py-2 text-sm font-medium whitespace-nowrap transition duration-200 ease-fluent cursor-pointer",
              isActive
                ? "bg-moss text-paper border-moss"
                : "border-line/55 bg-paper/72 text-dusk hover:bg-paper/90 hover:border-line/70"
            )}
          >
            <Icon className="h-4 w-4" />
            {meta.name} ({count})
          </button>
        );
      })}
    </div>
  );
}
