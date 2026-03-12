import { AmmSwapPanel } from "@/components/market/amm-swap-panel";
import { LiveMarketPanel } from "@/components/market/live-market-panel";
import { MarketplaceGrid } from "@/components/market/marketplace-grid";
import { MarketplaceHero } from "@/components/market/marketplace-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { getAmmPools, getMarketSummary } from "@/lib/api";

export default async function MarketPage() {
  const [summary, pools] = await Promise.all([
    getMarketSummary(),
    getAmmPools(),
  ]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  return (
    <main className="flex flex-col gap-section pt-8">
      <MarketplaceHero metrics={summary.metrics} />

      <MarketplaceGrid offers={summary.orderBook} />

      <section className="section-frame">
        <SectionHeading
          eyebrow="FERRAMENTAS PRO"
          heading="Dados de mercado e liquidez AMM."
          description="Acompanhe o book em tempo real por WebSocket e execute swaps nos pools de liquidez complementar."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <LiveMarketPanel apiUrl={apiUrl} initialData={summary} />
          <AmmSwapPanel pools={pools} />
        </div>
      </section>
    </main>
  );
}
