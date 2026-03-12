import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBonds, getCredentials, getOffers, getRedeems, getUsers } from "@/lib/api";
import { WalletOffersTable } from "@/components/tables/wallet-offers-table";
import { WalletRedeemsTable } from "@/components/tables/wallet-redeems-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocale } from "@/lib/get-locale";
import { getWebDictionary } from "@valyria/i18n/web";

export default async function WalletPage() {
  const locale = getLocale();
  const dict = getWebDictionary(locale);
  const t = (key: string) => dict[key] ?? key;

  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const [users, offers, bonds, redeems, credentials] = await Promise.all([
    getUsers(),
    getOffers(),
    getBonds(),
    getRedeems(),
    getCredentials()
  ]);

  const activeUser =
    users.find((user) => user.email === session?.user?.email) ??
    users.find((user) => user.id === session?.user?.id);

  if (!activeUser) {
    return (
      <main className="flex flex-col gap-section pt-8">
        <section>
          <Badge>{t("wallet.badge")}</Badge>
          <h1 className="mt-4 text-5xl leading-none text-dusk">{t("wallet.userNotFound")}</h1>
          <p className="mt-4 text-ink/72">{t("wallet.noProfile")}</p>
        </section>
      </main>
    );
  }

  const userOffers = offers.filter((offer) => offer.producerId === activeUser?.id);
  const userBonds = bonds.filter((bond) => bond.userId === activeUser?.id);
  const userRedeems = redeems.filter((redeem) => redeem.holderId === activeUser?.id);
  const userCredentials = credentials.filter((credential) => credential.userId === activeUser?.id);
  const exposure = userOffers.reduce((total, offer) => total + offer.notional, 0);

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow={t("wallet.eyebrow")}
          heading={t("wallet.heading")}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="label-caps">{t("wallet.activeProfile")}</div>
          <div className="mt-3 text-2xl text-dusk">{activeUser?.name ?? activeUser?.email ?? t("wallet.noUser")}</div>
          <div className="mt-2 text-sm text-ink/72">{activeUser?.state ?? "unknown"}</div>
        </Card>
        <Card className="p-5">
          <div className="label-caps">{t("wallet.bondInVex")}</div>
          <div className="mt-3 text-2xl text-dusk">
            {userBonds.reduce((total, bond) => total + bond.amount, 0).toLocaleString(locale)} VEX
          </div>
          <div className="mt-2 text-sm text-ink/72">{userBonds.length} {t("wallet.bondsLinked")}</div>
        </Card>
        <Card className="p-5">
          <div className="label-caps">{t("wallet.offerExposure")}</div>
          <div className="mt-3 text-2xl text-dusk">R$ {exposure.toLocaleString(locale)}</div>
          <div className="mt-2 text-sm text-ink/72">{userOffers.length} {t("wallet.positionsOriginated")}</div>
        </Card>
        <Card className="p-5">
          <div className="label-caps">{t("wallet.acceptedCredentials")}</div>
          <div className="mt-3 text-2xl text-dusk">{userCredentials.filter((item) => item.status === "accepted").length}</div>
          <div className="mt-2 text-sm text-ink/72">{userCredentials.length} {t("wallet.ledgerRecords")}</div>
        </Card>
      </section>

      <section className="grid gap-cluster lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <span className="eyebrow">{t("wallet.walletProfile")}</span>
          <div className="mt-4 grid gap-4">
            <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
              <div className="label-caps">{t("wallet.address")}</div>
              <div className="mt-2 break-all text-sm text-ink/72">{activeUser?.walletAddress ?? t("wallet.notLinked")}</div>
            </div>
            <div className="rounded-tile border border-line/45 bg-paper/72 p-4">
              <div className="label-caps">{t("wallet.redeemQueue")}</div>
              <div className="mt-2 text-2xl text-dusk">{userRedeems.length}</div>
              <div className="mt-2 text-sm text-ink/72">{t("wallet.redeemQueueDesc")}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <span className="eyebrow">{t("wallet.credentials")}</span>
          <div className="mt-4 grid gap-3">
            {userCredentials.map((credential) => (
              <div key={credential.id} className="rounded-tile border border-line/45 bg-paper/72 p-4">
                <div className="label-caps">{credential.kind}</div>
                <div className="mt-2 text-sm text-ink/72">{credential.subjectWallet ?? t("wallet.walletPending")}</div>
                <div className="mt-2 text-sm text-moss">{credential.status}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-cluster lg:grid-cols-2">
        <WalletOffersTable
          data={userOffers.map((offer) => ({
            id: offer.id,
            seriesAlias: offer.series.alias,
            status: offer.status,
            notional: offer.notional,
          }))}
        />

        <WalletRedeemsTable data={userRedeems} />
      </section>
    </main>
  );
}
