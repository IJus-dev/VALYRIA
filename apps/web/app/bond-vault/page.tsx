import { getBonds, getCredentials, getUsers } from "@/lib/api";
import { BondConsole } from "@/components/platform/bond-console";
import { BondVaultTable } from "@/components/tables/bond-vault-table";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export default async function BondVaultPage() {
  const [bonds, credentials, users] = await Promise.all([getBonds(), getCredentials(), getUsers()]);

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow="BOND VAULT"
          heading="Garantia custodial e credenciais aceitas."
        />
      </section>

      <section className="grid gap-cluster lg:grid-cols-[1.1fr_0.9fr]">
        <BondVaultTable data={bonds} />

        <BondConsole users={users} credentials={credentials} bonds={bonds} />

        <Card className="p-6">
          <span className="eyebrow">Accepted credentials</span>
          <div className="mt-4 grid gap-3">
            {credentials.map((credential) => (
              <div key={credential.id} className="rounded-tile border border-line/45 bg-paper/72 p-4">
                <div className="label-caps">
                  {credential.kind}
                </div>
                <div className="mt-2 text-sm text-ink/72">{credential.subjectWallet ?? "wallet pending"}</div>
                <div className="mt-2 text-sm text-moss">{credential.status}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
