"use client";

import { useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMarketStore } from "@/lib/stores/market-store";
import { useWebSocket } from "@/hooks/use-websocket";
import type { MarketSummary } from "@/lib/platform-types";
import { PriceTrend } from "@/components/market/price-trend";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface LiveMarketPanelProps {
  apiUrl: string;
  initialData: MarketSummary;
  authToken?: string;
}

interface MarketMessage {
  type?: string;
  payload?: MarketSummary;
}

function toWebSocketUrl(apiUrl: string): string {
  if (apiUrl.startsWith("https://")) {
    return apiUrl.replace("https://", "wss://");
  }

  return apiUrl.replace("http://", "ws://");
}

export function LiveMarketPanel({ apiUrl, initialData, authToken }: LiveMarketPanelProps) {
  const queryClient = useQueryClient();
  const setConnectionState = useMarketStore((s) => s.setConnectionState);

  const marketSummaryQuery = useQuery({
    queryKey: ["market-summary-live"],
    queryFn: async (): Promise<MarketSummary> => {
      const response = await fetch(`${apiUrl}/api/market/summary`);

      if (!response.ok) {
        throw new Error("Failed to load market summary.");
      }

      return (await response.json()) as MarketSummary;
    },
    initialData
  });

  const onMessage = useCallback(
    (data: MarketMessage) => {
      if (data.type === "market.summary" && data.payload) {
        queryClient.setQueryData(["market-summary-live"], data.payload);
      }
    },
    [queryClient]
  );

  const { isConnected } = useWebSocket<MarketMessage>(
    `${toWebSocketUrl(apiUrl)}/api/market/stream`,
    { onMessage, authToken }
  );

  const connectionState = isConnected ? "open" : "closed";

  useEffect(() => {
    setConnectionState(connectionState);
  }, [connectionState, setConnectionState]);

  const summary = marketSummaryQuery.data ?? initialData;
  const topSeries = useMemo(() => summary.orderBook.slice(0, 2), [summary.orderBook]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="eyebrow">WebSocket lane</span>
          <h2 className="mt-3 text-3xl text-dusk">Snapshot vivo do market summary.</h2>
        </div>
        <Badge variant="outline">{connectionState}</Badge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {summary.metrics.slice(0, 3).map((metric) => (
          <div key={metric.label} className="rounded-tile border border-line/45 bg-paper/72 p-4">
            <div className="label-caps text-clay">{metric.label}</div>
            <div className="mt-3 text-3xl text-dusk">{metric.value}</div>
            <div className="mt-2 text-sm text-ink/70">{metric.hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="h-64 rounded-tile border border-line/45 bg-sand/35 p-4">
          <PriceTrend data={summary.priceTrend} />
        </div>

        <div className="grid gap-3">
          {topSeries.map((offer) => (
            <div key={offer.id} className="rounded-tile border border-line/45 bg-paper/72 p-4">
              <div className="label-caps text-clay">{offer.status}</div>
              <div className="mt-2 text-2xl text-dusk">{offer.series}</div>
              <div className="mt-3 text-sm text-ink/72">
                {offer.quantity.toLocaleString("pt-BR")} unidades a R$ {offer.unitPrice.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
