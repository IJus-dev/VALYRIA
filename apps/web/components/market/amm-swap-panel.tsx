"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { postBackoffice } from "@/lib/backoffice-client";
import type { AmmPoolListItem } from "@/lib/platform-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface AmmSwapPanelProps {
  pools: AmmPoolListItem[];
}

interface AmmQuotePayload {
  pool: AmmPoolListItem;
  quote: {
    inputAsset: string;
    inputAmount: number;
    outputAsset: string;
    outputAmount: number;
    feeAmount: number;
    executionPrice: number;
    priceImpactPct: number;
  };
}

export function AmmSwapPanel({ pools }: AmmSwapPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [poolId, setPoolId] = useState(pools[0]?.id ?? "");
  const selectedPool = useMemo(() => pools.find((pool) => pool.id === poolId) ?? pools[0], [poolId, pools]);
  const [inputAsset, setInputAsset] = useState(selectedPool?.baseAsset ?? "MLH");
  const [inputAmount, setInputAmount] = useState("100");
  const [quote, setQuote] = useState<AmmQuotePayload["quote"] | null>(null);

  const assetOptions = selectedPool ? [selectedPool.baseAsset, selectedPool.quoteAsset] : [];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="eyebrow">AMM v1</span>
          <h2 className="mt-3 text-3xl text-dusk">Quote e swap local no pool constante.</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <Select
          value={poolId}
          onChange={(event) => {
            const nextPool = pools.find((pool) => pool.id === event.target.value);
            setPoolId(event.target.value);
            setInputAsset(nextPool?.baseAsset ?? "MLH");
            setQuote(null);
          }}
        >
          {pools.map((pool) => (
            <option key={pool.id} value={pool.id}>
              {pool.pair}
            </option>
          ))}
        </Select>

        <Select value={inputAsset} onChange={(event) => setInputAsset(event.target.value)}>
          {assetOptions.map((asset) => (
            <option key={asset} value={asset}>
              {asset}
            </option>
          ))}
        </Select>

        <Input value={inputAmount} onChange={(event) => setInputAmount(event.target.value)} />

        <div className="grid gap-3 md:grid-cols-2">
          <Button
            disabled={isPending || !poolId}
            variant="ghost"
            onClick={() => {
              startTransition(async () => {
                const result = await postBackoffice<AmmQuotePayload>("amm/quote", {
                  poolId,
                  inputAsset,
                  inputAmount: Number(inputAmount)
                });

                if (!result.ok) {
                  toast.error(result.message);
                  return;
                }

                setQuote(result.payload.quote);
                toast.success(`Quote pronta para ${result.payload.pool.pair}.`);
              });
            }}
          >
            {isPending ? "Calculando..." : "Gerar quote"}
          </Button>

          <Button
            disabled={isPending || !poolId}
            onClick={() => {
              startTransition(async () => {
                const result = await postBackoffice<AmmQuotePayload>("amm/swap", {
                  poolId,
                  inputAsset,
                  inputAmount: Number(inputAmount)
                });

                if (!result.ok) {
                  toast.error(result.message);
                  return;
                }

                setQuote(result.payload.quote);
                toast.success(`Swap executado em ${result.payload.pool.pair}.`);
                router.refresh();
              });
            }}
          >
            {isPending ? "Executando..." : "Executar swap"}
          </Button>
        </div>
      </div>

      {selectedPool ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
            <div className="label-caps text-clay">Reserve {selectedPool.baseAsset}</div>
            <div className="mt-2 text-2xl text-dusk">{selectedPool.baseReserve.toLocaleString("pt-BR")}</div>
          </div>
          <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
            <div className="label-caps text-clay">Reserve {selectedPool.quoteAsset}</div>
            <div className="mt-2 text-2xl text-dusk">{selectedPool.quoteReserve.toLocaleString("pt-BR")}</div>
          </div>
        </div>
      ) : null}

      {quote ? (
        <div className="mt-6 rounded-tile border border-line/45 bg-sand/40 p-4 text-sm leading-6 text-ink/72">
          Saída estimada: {quote.outputAmount.toFixed(4)} {quote.outputAsset}
          <br />
          Fee: {quote.feeAmount.toFixed(4)}
          <br />
          Preço de execução: {quote.executionPrice.toFixed(6)}
          <br />
          Impacto: {quote.priceImpactPct.toFixed(4)}%
        </div>
      ) : null}

    </Card>
  );
}
