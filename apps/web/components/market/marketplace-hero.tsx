import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocale } from "@/lib/get-locale";
import { getWebDictionary } from "@valyria/i18n/web";

interface MarketplaceHeroProps {
  metrics: Array<{
    label: string;
    value: string;
    hint: string;
  }>;
}

export function MarketplaceHero({ metrics }: MarketplaceHeroProps) {
  const locale = getLocale();
  const dict = getWebDictionary(locale);
  const t = (key: string) => dict[key] ?? key;

  return (
    <section className="flex flex-col gap-6">
      <SectionHeading
        eyebrow={t("marketplace.hero.eyebrow")}
        heading={t("marketplace.hero.heading")}
        description={t("marketplace.hero.desc")}
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
