import { getDisputes, getOffers, getOracles, getRedeems } from "@/lib/api";
import { PriceTrend } from "@/components/market/price-trend";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const [offers, oracles, redeems, disputes] = await Promise.all([getOffers(), getOracles(), getRedeems(), getDisputes()]);
  const notional = offers.reduce((total, offer) => total + offer.notional, 0);
  const byCommodity = offers.reduce<Record<string, { offers: number; notional: number }>>((accumulator, offer) => {
    const commodity = offer.series.alias.split(".")[0] ?? "UNK";
    const current = accumulator[commodity] ?? { offers: 0, notional: 0 };
    accumulator[commodity] = {
      offers: current.offers + 1,
      notional: current.notional + offer.notional
    };
    return accumulator;
  }, {});

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow="ANALYTICS"
          heading="Volumes, feeds e risco operacional por commodity."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="label-caps">Notional agregado</div>
          <div className="mt-3 text-3xl text-dusk">R$ {notional.toLocaleString("pt-BR")}</div>
        </Card>
        <Card className="p-5">
          <div className="label-caps">Feeds publicados</div>
          <div className="mt-3 text-3xl text-dusk">{oracles.length}</div>
        </Card>
        <Card className="p-5">
          <div className="label-caps">Redeems abertos</div>
          <div className="mt-3 text-3xl text-dusk">{redeems.length}</div>
        </Card>
        <Card className="p-5">
          <div className="label-caps">Disputas</div>
          <div className="mt-3 text-3xl text-dusk">{disputes.length}</div>
        </Card>
      </section>

      <section className="grid gap-cluster lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6">
          <span className="eyebrow">Reference feed</span>
          <div className="mt-4 h-72">
            <PriceTrend
              data={oracles
                .filter((oracle) => oracle.symbol === "MLH/BRL")
                .map((oracle, index) => ({
                  label: `P${index + 1}`,
                  value: oracle.value
                }))}
            />
          </div>
        </Card>

        <Card className="p-6">
          <span className="eyebrow">Commodity mix</span>
          <div className="mt-4 grid gap-3">
            {Object.entries(byCommodity).map(([commodity, metrics]) => (
              <div key={commodity} className="rounded-tile border border-line/45 bg-paper/72 p-4">
                <div className="label-caps">{commodity}</div>
                <div className="mt-2 text-2xl text-dusk">R$ {metrics.notional.toLocaleString("pt-BR")}</div>
                <div className="mt-2 text-sm text-ink/72">{metrics.offers} oferta(s) monitoradas</div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
