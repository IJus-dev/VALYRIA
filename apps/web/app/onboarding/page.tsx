import { getCredentials, getUsers } from "@/lib/api";
import { getLocale } from "@/lib/get-locale";
import { getWebDictionary } from "@valyria/i18n/web";
import { ComplianceConsole } from "@/components/platform/compliance-console";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export default async function OnboardingPage() {
  const locale = getLocale();
  const dict = getWebDictionary(locale);
  const t = (key: string) => dict[key] ?? key;

  const onboardingStages = [
    { key: "registered", label: t("onboarding.accountCreated") },
    { key: "email_verified", label: t("onboarding.emailValidated") },
    { key: "wallet_linked", label: t("onboarding.walletLinked") },
    { key: "kyc_approved", label: t("onboarding.kycAccepted") },
    { key: "producer_approved", label: t("onboarding.producerApproved") },
  ];

  const [users, credentials] = await Promise.all([getUsers(), getCredentials()]);
  const stateCounts = users.reduce<Record<string, number>>((accumulator, user) => {
    accumulator[user.state] = (accumulator[user.state] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow={t("onboarding.eyebrow")}
          heading={t("onboarding.heading")}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {onboardingStages.map((stage) => (
          <Card key={stage.key} className="p-5">
            <div className="label-caps">{stage.label}</div>
            <div className="mt-4 text-4xl text-dusk">{stateCounts[stage.key] ?? 0}</div>
          </Card>
        ))}
      </section>

      <section className="grid gap-cluster lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden p-0">
          <table className="min-w-full divide-y divide-line/45 text-left">
            <thead className="bg-dusk text-sand">
              <tr>
                <th className="px-4 py-3 label-caps text-sand">{t("onboarding.user")}</th>
                <th className="px-4 py-3 label-caps text-sand">{t("onboarding.state")}</th>
                <th className="px-4 py-3 label-caps text-sand">{t("onboarding.wallet")}</th>
                <th className="px-4 py-3 label-caps text-sand">{t("onboarding.profiles")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/45 bg-paper/72">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-dusk">{user.name ?? user.email}</div>
                    <div className="text-sm text-ink/72">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-moss">{user.state}</td>
                  <td className="px-4 py-3 text-sm text-ink/72">{user.walletAddress ?? t("onboarding.walletPending")}</td>
                  <td className="px-4 py-3 text-sm text-ink/72">{user.roles.join(", ") || t("onboarding.marketParticipant")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="grid gap-cluster">
          <ComplianceConsole users={users} credentials={credentials} />
        </div>
      </section>
    </main>
  );
}
