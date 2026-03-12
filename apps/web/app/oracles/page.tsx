import { getOracles } from "@/lib/api";
import { OraclePublishForm } from "@/components/platform/oracle-publish-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";

export default async function OraclesPage() {
  const oracles = await getOracles();

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow="ORACLE DESK"
          heading="Feed de preços publicados."
        />
      </section>

      <section className="grid gap-cluster lg:grid-cols-[0.95fr_1.05fr]">
        <OraclePublishForm />

        <div className="grid gap-4 md:grid-cols-2">
          {oracles.map((oracle) => (
            <Card key={oracle.id} className="p-5">
              <div className="label-caps">{oracle.symbol}</div>
              <div className="mt-4 text-4xl text-dusk">R$ {oracle.value.toFixed(2)}</div>
              <div className="mt-3 text-sm text-ink/72">{oracle.source}</div>
              <div className="mt-2 text-sm text-moss">
                {new Intl.DateTimeFormat("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric"
                }).format(new Date(oracle.publishedAt))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
