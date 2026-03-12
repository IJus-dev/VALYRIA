import { ArrowRight, ShieldCheck, WalletCards, Wheat } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PriceTrend } from "@/components/market/price-trend";
import { DashboardOrderBook } from "@/components/tables/dashboard-order-book";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMarketSummary } from "@/lib/api";
import { getLocale } from "@/lib/get-locale";
import { getWebDictionary } from "@valyria/i18n/web";

export default async function DashboardPage() {
  const locale = getLocale();
  const dict = getWebDictionary(locale);
  const t = (key: string) => dict[key] ?? key;

  const summary = await getMarketSummary();

  const features = [
    { icon: Wheat, titleKey: "dashboard.seriesTokens.title", descKey: "dashboard.seriesTokens.desc" },
    { icon: WalletCards, titleKey: "dashboard.bondVault.title", descKey: "dashboard.bondVault.desc" },
    { icon: ShieldCheck, titleKey: "dashboard.redeemTraceable.title", descKey: "dashboard.redeemTraceable.desc" },
  ];

  const lifecycleItems = [
    { label: t("dashboard.lifecycle.auth"), value: t("dashboard.lifecycle.authDesc") },
    { label: t("dashboard.lifecycle.bond"), value: t("dashboard.lifecycle.bondDesc") },
    { label: t("dashboard.lifecycle.market"), value: t("dashboard.lifecycle.marketDesc") },
    { label: t("dashboard.lifecycle.redeem"), value: t("dashboard.lifecycle.redeemDesc") },
  ];

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="hero-grid">
        <Card className="overflow-hidden p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{t("dashboard.badge")}</Badge>
            <span className="eyebrow">{t("dashboard.eyebrow")}</span>
          </div>

          <div className="mt-6 max-w-3xl">
            <h1 className="text-5xl leading-[0.95] text-dusk sm:text-6xl">
              {t("dashboard.heading")}
            </h1>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/offers/new">
              {t("dashboard.createOffer")}
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/market" variant="ghost">{t("dashboard.openMarketLane")}</ButtonLink>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {features.map((item) => (
              <div key={item.titleKey} className="rounded-tile border border-line/45 bg-sand/55 p-4">
                <item.icon className="h-5 w-5 text-moss" />
                <h3 className="mt-4 text-2xl text-dusk">{t(item.titleKey)}</h3>
                <p className="mt-2 body-copy">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <span className="eyebrow">{t("dashboard.topology.eyebrow")}</span>
          <h2 className="mt-4 text-3xl text-dusk">{t("dashboard.topology.heading")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">network: {summary.networkStatus.mode}</Badge>
            <Badge variant="outline">
              {summary.networkStatus.connected ? t("dashboard.validatedLink") : t("dashboard.bridgeStandby")}
            </Badge>
          </div>
          <div className="mt-6 grid gap-3">
            {Object.entries(summary.accountTopology).map(([key, value]) => (
              <div key={key} className="rounded-tile border border-line/45 bg-paper/72 p-4">
                <div className="eyebrow">
                  {key}
                </div>
                <div className="mt-2 break-all text-sm text-ink/70">{value}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-cluster lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="eyebrow">{t("dashboard.marketSnapshot.eyebrow")}</span>
              <h2 className="mt-3 text-3xl text-dusk">{t("dashboard.marketSnapshot.heading")}</h2>
            </div>
            <Badge variant="outline">{t("dashboard.marketSnapshot.badge")}</Badge>
          </div>

          <div className="mt-6 h-72">
            <PriceTrend data={summary.priceTrend} />
          </div>

          <div className="mt-6">
            <DashboardOrderBook data={summary.orderBook} />
          </div>
        </Card>

        <div className="grid gap-cluster">
          <Card className="p-6">
            <span className="eyebrow">{t("dashboard.coreLanes")}</span>
            <div className="mt-5 grid gap-4">
              {summary.lifecycle.map((item) => (
                <div key={item.step} className="rounded-tile border border-line/45 bg-paper/72 p-4">
                  <div className="label-caps">
                    {item.step}
                  </div>
                  <h3 className="mt-2 text-2xl text-dusk">{item.title}</h3>
                  <p className="mt-2 body-copy">{item.description}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <span className="eyebrow">{t("dashboard.lifecycle.eyebrow")}</span>
            <div className="mt-4 grid gap-3">
              {lifecycleItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-tile border border-line/45 bg-paper/72 px-4 py-3">
                  <span className="label-caps">{item.label}</span>
                  <span className="text-sm text-moss">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
