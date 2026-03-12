import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAuditLogs, getOffers, getProofs, getRedeems, getUsers } from "@/lib/api";
import { AdminOffersTable } from "@/components/tables/admin-offers-table";
import { SectionHeading } from "@/components/ui/section-heading";

export default async function AdminOffersPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userRoles = session.user.roles ?? [];
  const hasAdminAccess = userRoles.includes("admin") || userRoles.includes("operations");

  if (!hasAdminAccess) {
    redirect("/dashboard");
  }

  const [offers, users, proofs, redeems, auditLogs] = await Promise.all([
    getOffers(),
    getUsers(),
    getProofs(),
    getRedeems(),
    getAuditLogs()
  ]);

  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow="PRODUCER ADMIN"
          heading="Gestão operacional de ofertas, provas e settle queue."
        />
      </section>

      <AdminOffersTable
        data={offers.map((offer) => {
          const proofCount = proofs.filter((proof) => proof.offerId === offer.id).length;
          const redeemCount = redeems.filter((redeem) => redeem.offerId === offer.id).length;
          const latestEvent = auditLogs.find((log) => log.entityId === offer.id);

          return {
            id: offer.id,
            seriesAlias: offer.series.alias,
            status: offer.status,
            producerName: userMap.get(offer.producerId)?.name ?? offer.producerId,
            executionLane: offer.executionLane,
            proofCount,
            redeemCount,
            latestEvent: latestEvent?.action ?? "sem trilha",
          };
        })}
      />
    </main>
  );
}
