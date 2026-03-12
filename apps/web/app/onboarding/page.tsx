import { getCredentials, getUsers } from "@/lib/api";
import { ComplianceConsole } from "@/components/platform/compliance-console";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

const onboardingStages = [
  { key: "registered", label: "Conta criada" },
  { key: "email_verified", label: "Email validado" },
  { key: "wallet_linked", label: "Wallet vinculada" },
  { key: "kyc_approved", label: "KYC aceito" },
  { key: "producer_approved", label: "Producer approved" }
];

export default async function OnboardingPage() {
  const [users, credentials] = await Promise.all([getUsers(), getCredentials()]);
  const stateCounts = users.reduce<Record<string, number>>((accumulator, user) => {
    accumulator[user.state] = (accumulator[user.state] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow="ONBOARDING & COMPLIANCE"
          heading="Pipeline de identidade, wallet proof e credenciais."
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
                <th className="px-4 py-3 label-caps text-sand">Usuário</th>
                <th className="px-4 py-3 label-caps text-sand">Estado</th>
                <th className="px-4 py-3 label-caps text-sand">Wallet</th>
                <th className="px-4 py-3 label-caps text-sand">Perfis</th>
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
                  <td className="px-4 py-3 text-sm text-ink/72">{user.walletAddress ?? "wallet pending"}</td>
                  <td className="px-4 py-3 text-sm text-ink/72">{user.roles.join(", ") || "market participant"}</td>
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
