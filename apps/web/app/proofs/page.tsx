import Link from "next/link";
import { getOffers, getProofs, getUsers } from "@/lib/api";
import { getLocale } from "@/lib/get-locale";
import { getWebDictionary } from "@valyria/i18n/web";
import { ProofCreateForm } from "@/components/platform/proof-create-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";

export default async function ProofsPage() {
  const locale = getLocale();
  const dict = getWebDictionary(locale);
  const t = (key: string) => dict[key] ?? key;

  const [proofs, offers, users] = await Promise.all([getProofs(), getOffers(), getUsers()]);
  const offerMap = new Map(offers.map((offer) => [offer.id, offer]));

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow={t("proofs.eyebrow")}
          heading={t("proofs.heading")}
        />
      </section>

      <section className="grid gap-cluster lg:grid-cols-[0.95fr_1.05fr]">
        <ProofCreateForm users={users} offers={offers} />

        <div className="grid gap-5 md:grid-cols-2">
          {proofs.map((proof) => (
            <Card key={proof.id} className="p-5">
              <div className="label-caps">{proof.artifactType}</div>
              <h2 className="mt-3 text-3xl text-dusk">{proof.commodity}</h2>
              <p className="mt-3 break-all text-sm leading-6 text-ink/72">{proof.uri}</p>
              <div className="mt-3 text-sm text-moss">
                {proof.offerId ? offerMap.get(proof.offerId)?.series.alias ?? proof.offerId : t("proofs.offOffer")}
              </div>
              <div className="mt-4 grid gap-2 text-sm text-ink/72">
                <div>CID: {proof.ipfsCid ?? t("proofs.pending")}</div>
                <div>Hash: {proof.manifestHash ? `${proof.manifestHash.slice(0, 16)}...` : t("proofs.na")}</div>
                <div>NFT: {proof.nftTokenId ? `${proof.nftTokenId.slice(0, 16)}...` : t("proofs.pending")}</div>
              </div>
              <div className="mt-5">
                <Link href={`/proofs/${proof.id}`} className="text-sm font-semibold text-moss">
                  {t("proofs.viewPackage")}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
