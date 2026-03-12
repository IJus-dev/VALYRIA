import Link from "next/link";
import {
  getCommodityFromAlias,
  parseSeriesAlias,
  getRegionName,
} from "@/lib/commodity-catalog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OfferProductCardProps {
  offer: {
    id: string;
    series: string;
    quantity: number;
    unitPrice: number;
    notional: number;
    status: string;
    executionLane: "local" | "xrpl_dex";
    expiresAt: string;
  };
}

const STATUS_LABEL: Record<string, string> = {
  listed: "Listada",
  partially_filled: "Parcial",
  filled: "Preenchida",
};

const STATUS_VARIANT: Record<string, "outline" | "default"> = {
  listed: "outline",
  partially_filled: "default",
  filled: "default",
};

const LANE_LABEL: Record<string, string> = {
  local: "Local",
  xrpl_dex: "XRPL DEX",
};

const expiryFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function OfferProductCard({ offer }: OfferProductCardProps) {
  const meta = getCommodityFromAlias(offer.series);
  const parsed = parseSeriesAlias(offer.series);
  const Icon = meta?.icon;

  const regionName = parsed ? getRegionName(parsed.region) : null;
  const formattedQuantity = offer.quantity.toLocaleString("pt-BR");
  const formattedUnitPrice = `R$ ${offer.unitPrice.toFixed(2)}`;
  const formattedNotional = `R$ ${offer.notional.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}`;
  const formattedExpiry = expiryFormatter.format(new Date(offer.expiresAt));

  const statusLabel = STATUS_LABEL[offer.status] ?? offer.status;
  const statusVariant = STATUS_VARIANT[offer.status] ?? "outline";
  const laneLabel = LANE_LABEL[offer.executionLane] ?? offer.executionLane;

  return (
    <Link href={`/offers/${offer.id}`} className="block">
      <Card
        tone="soft"
        className="flex flex-col gap-4 p-frame transition duration-200 ease-fluent hover:-translate-y-1 hover:shadow-hero"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon ? (
              <Icon
                className={`h-6 w-6 ${
                  meta.accentTone === "moss" ? "text-moss" : "text-clay"
                }`}
              />
            ) : null}
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>

        {meta ? (
          <span
            className={`text-xs font-semibold uppercase tracking-eyebrow ${
              meta.accentTone === "moss" ? "text-moss" : "text-clay"
            }`}
          >
            {meta.code} &middot; {meta.name}
          </span>
        ) : null}

        <span className="font-mono text-sm text-ink/60">{offer.series}</span>

        {parsed ? (
          <span className="text-sm text-ink/65">
            Regi&atilde;o: {regionName} &middot; Safra: {parsed.year}/
            {parsed.cycle}
          </span>
        ) : null}

        {parsed && meta ? (
          <span className="text-sm text-ink/65">
            Grade: {parsed.grade} &middot; {meta.unit}
          </span>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-tile border border-line/45 bg-paper/72 p-frame">
            <span className="text-xs font-semibold uppercase tracking-eyebrow text-clay">
              Quantidade
            </span>
            <p className="mt-1 text-lg font-semibold text-dusk">
              {formattedQuantity}
            </p>
          </div>
          <div className="rounded-tile border border-line/45 bg-paper/72 p-frame">
            <span className="text-xs font-semibold uppercase tracking-eyebrow text-clay">
              Pre&ccedil;o unit&aacute;rio
            </span>
            <p className="mt-1 text-lg font-semibold text-dusk">
              {formattedUnitPrice}
            </p>
          </div>
        </div>

        <p className="text-lg font-semibold text-dusk">
          Valor total: {formattedNotional}
        </p>

        <div className="flex items-center justify-between">
          <Badge variant="neutral">{laneLabel}</Badge>
          <span className="text-sm text-ink/65">{formattedExpiry}</span>
        </div>

        <span className="text-sm font-semibold text-moss">
          Ver detalhes &rarr;
        </span>
      </Card>
    </Link>
  );
}
