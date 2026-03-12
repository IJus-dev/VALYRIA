"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <span className="label-caps mb-1 block">Busca</span>
        <Input
          className="w-full sm:w-72"
          placeholder="Buscar por série, commodity ou região..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div>
        <span className="label-caps mb-1 block">Status</span>
        <Select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">Todas</option>
          <option value="listed">Listadas</option>
          <option value="partially_filled">Parciais</option>
        </Select>
      </div>

      <div>
        <span className="label-caps mb-1 block">Ordenar por</span>
        <Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
          <option value="expires_soon">Expira em breve</option>
          <option value="newest">Mais recente</option>
        </Select>
      </div>
    </div>
  );
}
