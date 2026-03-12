import Link from "next/link";
import { getMarketSummary, getOfferDetails, getUsers } from "@/lib/api";
import { OfferBuyForm } from "@/components/platform/offer-buy-form";
import { RedeemRequestForm } from "@/components/platform/redeem-console";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface OfferDetailsPageProps {
  params: Promise<{
    offerId: string;
  }>;
}

export default async function OfferDetailsPage({ params }: OfferDetailsPageProps) {
  const { offerId } = await params;
  const [details, users, marketSummary] = await Promise.all([getOfferDetails(offerId), getUsers(), getMarketSummary()]);
  const holders = users.filter((user) => user.state === "kyc_approved" || user.state === "producer_approved");
  const redeemEligibleHolders = details.offer.currentHolderId
    ? holders.filter((user) => user.id === details.offer.currentHolderId)
    : [];
  const settlementWallet = marketSummary.accountTopology.settlement ?? "settlement-unavailable";

  return (
    <main className="grid gap-8 pt-8 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>{details.offer.status}</Badge>
          <Badge variant="outline">{details.offer.series.alias}</Badge>
          <Badge variant="outline">
            {details.offer.executionLane === "xrpl_dex" ? "XRPL DEX" : "local lane"}
          </Badge>
        </div>
        <h1 className="mt-5 text-5xl leading-none text-dusk">{details.offer.series.alias}</h1>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
            <div className="label-caps">Quantidade</div>
            <div className="mt-3 text-3xl text-dusk">{details.offer.quantity.toLocaleString("pt-BR")}</div>
          </div>
          <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
            <div className="label-caps">Preço</div>
            <div className="mt-3 text-3xl text-dusk">R$ {details.offer.unitPrice.toFixed(2)}</div>
          </div>
          <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
            <div className="label-caps">Notional</div>
            <div className="mt-3 text-3xl text-dusk">R$ {details.offer.notional.toLocaleString("pt-BR")}</div>
          </div>
        </div>

        {(details.offer.ledgerHash || details.offer.fillLedgerHash || details.offer.currentHolderId) ? (
          <div className="mt-8 grid gap-3">
            {details.offer.ledgerHash ? (
              <div className="flex items-center justify-between gap-4 rounded-tile border border-line/45 bg-sand/40 px-4 py-3">
                <span className="label-caps shrink-0">Ledger hash</span>
                <span className="truncate text-sm text-ink/72">{details.offer.ledgerHash}</span>
              </div>
            ) : null}
            {details.offer.fillLedgerHash ? (
              <div className="flex items-center justify-between gap-4 rounded-tile border border-line/45 bg-sand/40 px-4 py-3">
                <span className="label-caps shrink-0">Fill hash</span>
                <span className="truncate text-sm text-ink/72">{details.offer.fillLedgerHash}</span>
              </div>
            ) : null}
            {details.offer.currentHolderId ? (
              <div className="flex items-center justify-between gap-4 rounded-tile border border-line/45 bg-sand/40 px-4 py-3">
                <span className="label-caps shrink-0">Holder</span>
                <span className="text-sm text-ink/72">{details.currentHolder?.name ?? details.currentHolder?.email ?? details.offer.currentHolderId}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 rounded-tile border border-line/45 bg-paper/72 p-5">
          <div className="label-caps">Proof package</div>
          <div className="mt-4 grid gap-3">
            {details.proofs.map((proof) => (
              <div key={proof.id} className="rounded-tile border border-line/45 bg-sand/40 p-4">
                <div className="label-caps">{proof.artifactType}</div>
                <div className="mt-2 break-all text-sm text-ink/72">{proof.uri}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-cluster">
        <Card className="p-6">
          <span className="eyebrow">Producer</span>
          <h2 className="mt-4 text-3xl text-dusk">{details.producer?.name ?? details.producer?.email ?? "unknown"}</h2>
          <div className="mt-3 text-sm leading-6 text-ink/72">
            Estado: {details.producer?.state ?? "n/a"}
            <br />
            Wallet: {details.producer?.walletAddress ?? "pending"}
          </div>
        </Card>

        {details.offer.status === "listed" ? <OfferBuyForm offer={details.offer} holders={holders} /> : null}

        <Card className="p-6">
          <span className="eyebrow">Redeem lane</span>
          <div className="mt-4 grid gap-3">
            {details.redeems.length === 0 ? (
              <div className="rounded-tile border border-line/45 bg-paper/72 p-4 text-sm text-ink/72">
                Nenhum redeem aberto para esta oferta.
              </div>
            ) : (
              details.redeems.map((redeem) => (
                <div key={redeem.id} className="rounded-tile border border-line/45 bg-paper/72 p-4">
                  <div className="flex items-center justify-between">
                    <span className="label-caps">{redeem.state}</span>
                    {redeem.trackingCode ? <span className="text-sm text-moss">{redeem.trackingCode}</span> : null}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-6">
            <Link href="/redeems" className="text-sm font-semibold text-moss">
              Abrir painel de redeem
            </Link>
          </div>
        </Card>

        <RedeemRequestForm
          offerId={details.offer.id}
          holders={redeemEligibleHolders}
          settlementWallet={settlementWallet}
        />
      </div>
    </main>
  );
}
