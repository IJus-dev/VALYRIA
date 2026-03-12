import { getAuditLogs, getDisputes, getRedeems, getUsers } from "@/lib/api";
import { DisputeOpenForm, DisputeTransitionForm } from "@/components/platform/dispute-open-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export default async function DisputesPage() {
  const [disputes, auditLogs, redeems, users] = await Promise.all([getDisputes(), getAuditLogs(), getRedeems(), getUsers()]);

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow="DISPUTE WORKFLOW"
          heading="Tier 1, evidências e trilha de auditoria."
        />
      </section>

      <section className="grid gap-cluster lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id} className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">{dispute.tier}</Badge>
                <Badge variant="outline">{dispute.state}</Badge>
              </div>
              <p className="mt-4 text-base leading-7 text-dusk">{dispute.reason}</p>
              {(dispute.bondDecision || dispute.resolutionSummary) ? (
                <div className="mt-3 text-sm text-moss">
                  {dispute.bondDecision ?? dispute.resolutionSummary}
                </div>
              ) : null}
            </Card>
          ))}
        </div>

        <div className="grid gap-cluster">
          <DisputeOpenForm redeems={redeems} users={users} />
          <DisputeTransitionForm disputes={disputes} />
        </div>

        <Card className="p-6">
          <span className="eyebrow">Audit tail</span>
          <div className="mt-4 grid gap-3">
            {auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-tile border border-line/45 bg-paper/72 px-4 py-3">
                <span className="label-caps">{log.action}</span>
                <span className="text-sm text-ink/50">{log.entityType}</span>
              </div>
            ))}
          </div>
          {auditLogs.length > 10 ? (
            <p className="mt-3 text-sm text-ink/50">+{auditLogs.length - 10} registros anteriores</p>
          ) : null}
        </Card>
      </section>
    </main>
  );
}
