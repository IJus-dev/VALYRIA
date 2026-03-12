import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

interface MarketplaceHeroProps {
  metrics: Array<{
    label: string;
    value: string;
    hint: string;
  }>;
}

export function MarketplaceHero({ metrics }: MarketplaceHeroProps) {
  return (
    <section className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="MERCADO VALYRIA"
        heading="Contratos agrícolas com garantia, prova e entrega auditável."
        description="Explore ofertas de séries tokenizadas de commodities brasileiras. Cada oferta nasce com bond travado, prova verificável e rota operacional até a entrega física."
        titleTag="h1"
      />

      {metrics.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} tone="soft" className="px-4 py-3">
              <span className="label-caps">{metric.label}</span>
              <div className="mt-1 text-2xl font-semibold text-dusk">
                {metric.value}
              </div>
              <div className="mt-1 text-xs text-ink/55">{metric.hint}</div>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
