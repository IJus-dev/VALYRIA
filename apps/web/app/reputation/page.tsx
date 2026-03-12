import { getBonds, getCredentials, getDisputes, getOffers, getRedeems, getUsers } from "@/lib/api";
import { computeReputationScores } from "@/lib/reputation";
import { ReputationTable } from "@/components/tables/reputation-table";
import { SectionHeading } from "@/components/ui/section-heading";

export default async function ReputationPage() {
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
          eyebrow="REPUTATION"
          heading="Score inicial combinando credenciais, bond e histórico."
        />
      </section>

      <ReputationTable data={reputationRows} />
    </main>
  );
}
