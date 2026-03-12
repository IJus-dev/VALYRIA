"use client";

import { useMemo, useState } from "react";
import {
  COMMODITY_CATALOG,
  getCommodityFromAlias,
  getRegionName,
} from "@/lib/commodity-catalog";
import { useLocale } from "@/lib/locale-context";
import { Card } from "@/components/ui/card";
import { CommodityFilterStrip } from "@/components/market/commodity-filter-strip";
import { MarketplaceFilters } from "@/components/market/marketplace-filters";
import { OfferProductCard } from "@/components/market/offer-product-card";

interface OrderBookItem {
  id: string;
  series: string;
  quantity: number;
  unitPrice: number;
  notional: number;
  status: string;
  executionLane: "local" | "xrpl_dex";
  expiresAt: string;
  sellerWallet?: string;
  ledgerHash?: string;
  ledgerOfferSequence?: number;
}

interface MarketplaceGridProps {
  offers: OrderBookItem[];
}

export function MarketplaceGrid({ offers }: MarketplaceGridProps) {
  const { t } = useLocale();
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("price_asc");

  const commodityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const offer of offers) {
      const code = offer.series.split(".")[0] ?? "???";
      counts[code] = (counts[code] ?? 0) + 1;
    }
    return counts;
  }, [offers]);

  const filteredOffers = useMemo(() => {
    let result = [...offers];

    if (selectedCommodity) {
      result = result.filter(
        (o) => (o.series.split(".")[0] ?? "") === selectedCommodity
      );
    }

    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        if (o.series.toLowerCase().includes(query)) return true;

        const meta = getCommodityFromAlias(o.series);
        if (meta?.name.toLowerCase().includes(query)) return true;

        const parts = o.series.split(".");
        if (parts[1]) {
          const regionName = getRegionName(parts[1]);
          if (regionName.toLowerCase().includes(query)) return true;
        }

        return false;
      });
    }

    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => a.unitPrice - b.unitPrice);
        break;
      case "price_desc":
        result.sort((a, b) => b.unitPrice - a.unitPrice);
        break;
      case "expires_soon":
        result.sort(
          (a, b) =>
            new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
        );
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
        );
        break;
    }

    return result;
  }, [offers, selectedCommodity, statusFilter, searchQuery, sortBy]);

  return (
    <section className="flex flex-col gap-6">
      <CommodityFilterStrip
        commodityCounts={commodityCounts}
        selected={selectedCommodity}
        onSelect={setSelectedCommodity}
      />

      <MarketplaceFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {filteredOffers.length > 0 ? (
        <div className="grid grid-cols-1 gap-cluster sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <OfferProductCard key={offer.id} offer={offer} />
          ))}
        </div>
      ) : (
        <Card tone="soft" className="p-8 text-center">
          <p className="text-lg text-dusk">{t("marketplace.grid.empty")}</p>
          <p className="mt-2 text-sm text-ink/65">
            {t("marketplace.grid.emptyDesc")}
          </p>
        </Card>
      )}
    </section>
  );
}
