import { getBonds, getCredentials, getDisputes, getOffers, getRedeems, getUsers } from "@/lib/api";
import { getLocale } from "@/lib/get-locale";
import { getWebDictionary } from "@valyria/i18n/web";
import { computeReputationScores } from "@/lib/reputation";
import { ReputationTable } from "@/components/tables/reputation-table";
import { SectionHeading } from "@/components/ui/section-heading";

export default async function ReputationPage() {
  const locale = getLocale();
  const dict = getWebDictionary(locale);
  const t = (key: string) => dict[key] ?? key;

  const [users, offers, bonds, credentials, redeems, disputes] = await Promise.all([
    getUsers(),
    getOffers(),
    getBonds(),
    getCredentials(),
    getRedeems(),
    getDisputes(),
  ]);

  const reputationRows = computeReputationScores(users, offers, bonds, credentials, redeems, disputes);

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow={t("reputation.eyebrow")}
          heading={t("reputation.heading")}
        />
      </section>

      <ReputationTable data={reputationRows} />
    </main>
  );
}
