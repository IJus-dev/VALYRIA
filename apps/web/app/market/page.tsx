import { AmmSwapPanel } from "@/components/market/amm-swap-panel";
import { LiveMarketPanel } from "@/components/market/live-market-panel";
import { MarketplaceGrid } from "@/components/market/marketplace-grid";
import { MarketplaceHero } from "@/components/market/marketplace-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { getAmmPools, getMarketSummary } from "@/lib/api";
import { getLocale } from "@/lib/get-locale";
import { getWebDictionary } from "@valyria/i18n/web";

export default async function MarketPage() {
  const locale = getLocale();
  const dict = getWebDictionary(locale);
  const t = (key: string) => dict[key] ?? key;

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
          eyebrow={t("market.eyebrow")}
          heading={t("market.heading")}
          description={t("market.desc")}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <LiveMarketPanel apiUrl={apiUrl} initialData={summary} />
          <AmmSwapPanel pools={pools} />
        </div>
      </section>
    </main>
  );
}
