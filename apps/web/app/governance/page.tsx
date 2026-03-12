import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProposalForm } from "@/components/platform/proposal-form";
import { API_URL, buildOperatorHeaders } from "@/lib/platform-server";

interface ProposalItem {
  id: string;
  code: string;
  title: string;
  summary: string;
  status: string;
  authorId: string;
}

async function fetchProposals(): Promise<ProposalItem[]> {
  const res = await fetch(`${API_URL}/api/governance`, {
    headers: buildOperatorHeaders(),
    cache: "no-store"
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.items ?? [];
}

async function fetchUsers(): Promise<Array<{ id: string; name: string | null; email: string | null }>> {
  const res = await fetch(`${API_URL}/api/onboarding/users`, {
    headers: buildOperatorHeaders(),
    cache: "no-store"
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? []).map((u: { id: string; name?: string; email?: string }) => ({
    id: u.id,
    name: u.name ?? null,
    email: u.email ?? null
  }));
}

export default async function GovernancePage() {
  const [proposals, users] = await Promise.all([
    fetchProposals(),
    fetchUsers()
  ]);

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow="GOVERNANCE"
          heading="Hub inicial de propostas para a camada DAO."
        />
      </section>

      <ProposalForm users={users} />

      <div className="grid gap-5 lg:grid-cols-3">
        {proposals.map((proposal) => (
          <Card key={proposal.id} className="p-6">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="outline">{proposal.status}</Badge>
              <span className="label-caps">{proposal.code}</span>
            </div>
            <h2 className="mt-4 text-3xl text-dusk">{proposal.title}</h2>
            <p className="mt-4 text-sm leading-6 text-ink/72">{proposal.summary}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
