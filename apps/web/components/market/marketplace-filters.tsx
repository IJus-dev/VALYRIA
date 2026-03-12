"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLocale } from "@/lib/locale-context";

interface MarketplaceFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export function MarketplaceFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
}: MarketplaceFiltersProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <span className="label-caps mb-1 block">{t("marketplace.filters.search")}</span>
        <Input
          className="w-full sm:w-72"
          placeholder={t("marketplace.filters.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div>
        <span className="label-caps mb-1 block">{t("marketplace.filters.status")}</span>
        <Select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">{t("marketplace.filters.all")}</option>
          <option value="listed">{t("marketplace.filters.listed")}</option>
          <option value="partially_filled">{t("marketplace.filters.partial")}</option>
        </Select>
      </div>

      <div>
        <span className="label-caps mb-1 block">{t("marketplace.filters.sortBy")}</span>
        <Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="price_asc">{t("marketplace.filters.lowestPrice")}</option>
          <option value="price_desc">{t("marketplace.filters.highestPrice")}</option>
          <option value="expires_soon">{t("marketplace.filters.expiringSoon")}</option>
          <option value="newest">{t("marketplace.filters.mostRecent")}</option>
        </Select>
      </div>
    </div>
  );
}
