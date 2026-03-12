import Link from "next/link";
import { getDisputes, getOffers, getRedeems } from "@/lib/api";
import { getLocale } from "@/lib/get-locale";
import { getWebDictionary } from "@valyria/i18n/web";
import { RedeemAutoAcceptForm, RedeemTransitionForm } from "@/components/platform/redeem-console";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export default async function RedeemsPage() {
  const locale = getLocale();
  const dict = getWebDictionary(locale);
  const t = (key: string) => dict[key] ?? key;

  const [redeems, offers, disputes] = await Promise.all([getRedeems(), getOffers(), getDisputes()]);
  const offerMap = new Map(offers.map((offer) => [offer.id, offer]));

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow={t("redeems.eyebrow")}
          heading={t("redeems.heading")}
        />
      </section>

      <section className="grid gap-cluster lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          {redeems.map((redeem) => {
            const offer = offerMap.get(redeem.offerId);
            const dispute = disputes.find((item) => item.redeemId === redeem.id);

            return (
              <Card key={redeem.id} className="p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline">{redeem.state}</Badge>
                  <Badge variant="outline">{offer?.series.alias ?? redeem.offerId}</Badge>
                </div>
                <h2 className="mt-4 text-3xl text-dusk">{offer?.series.alias ?? redeem.offerId}</h2>
                <div className="mt-4 grid gap-3">
                  {redeem.trackingCode ? (
                    <div className="flex items-center justify-between rounded-tile border border-line/45 bg-paper/72 px-4 py-3">
                      <span className="label-caps">{t("redeems.tracking")}</span>
                      <span className="text-sm text-moss">{redeem.trackingCode}</span>
                    </div>
                  ) : null}
                  {redeem.settlementLedgerHash ? (
                    <div className="flex items-center justify-between rounded-tile border border-line/45 bg-paper/72 px-4 py-3">
                      <span className="label-caps">{t("redeems.settlement")}</span>
                      <span className="truncate text-sm text-ink/72">{redeem.settlementLedgerHash}</span>
                    </div>
                  ) : null}
                  {(redeem.shippedAt || redeem.deliveredAt) ? (
                    <div className="flex items-center gap-4 rounded-tile border border-line/45 bg-paper/72 px-4 py-3 text-sm text-ink/72">
                      {redeem.shippedAt ? <span>{t("redeems.shipped")}{redeem.shippedAt.slice(0, 10)}</span> : null}
                      {redeem.deliveredAt ? <span>{t("redeems.delivered")}{redeem.deliveredAt.slice(0, 10)}</span> : null}
                    </div>
                  ) : null}
                </div>
                {dispute ? (
                  <div className="mt-4 rounded-tile border border-clay/30 bg-clay/5 p-4 text-sm text-ink/72">
                    {t("redeems.dispute")}{dispute.reason}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>

        <div className="grid gap-cluster">
          <RedeemTransitionForm redeems={redeems} />
          <RedeemAutoAcceptForm />

          <Card className="p-6">
            <span className="eyebrow">{t("redeems.disputes")}</span>
            <p className="mt-3 body-copy">{t("redeems.autoAcceptDesc")}</p>
            <div className="mt-4">
              <Link href="/disputes" className="text-sm font-semibold text-moss">
                {t("redeems.openDisputeCenter")}
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
