import { getAuditLogs, getDisputes, getRedeems } from "@/lib/api";
import { getLocale } from "@/lib/get-locale";
import { getWebDictionary } from "@valyria/i18n/web";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";

export default async function NotificationsPage() {
  const locale = getLocale();
  const dict = getWebDictionary(locale);
  const t = (key: string) => dict[key] ?? key;

  const [auditLogs, disputes, redeems] = await Promise.all([getAuditLogs(), getDisputes(), getRedeems()]);
  const items = [
    ...auditLogs.map((log) => ({
      id: log.id,
      title: log.action,
      body: `${log.entityType} :: ${log.entityId}`,
      createdAt: log.createdAt
    })),
    ...disputes.map((dispute) => ({
      id: dispute.id,
      title: "dispute.alert",
      body: dispute.reason,
      createdAt: dispute.createdAt
    })),
    ...redeems.map((redeem) => ({
      id: redeem.id,
      title: "redeem.status",
      body: `${redeem.offerId} ${t("notifications.redeemEnteredState")} ${redeem.state}.`,
      createdAt: redeem.requestedAt
    }))
  ].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const visible = items.slice(0, 20);

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow={t("notifications.eyebrow")}
          heading={t("notifications.heading")}
        />
      </section>

      <div className="grid gap-3">
        {visible.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 rounded-tile border border-line/45 bg-paper/72 px-5 py-4">
            <div className="flex items-center gap-4 min-w-0">
              <span className="label-caps shrink-0">{item.title}</span>
              <span className="truncate text-sm text-dusk">{item.body}</span>
            </div>
            <span className="shrink-0 text-sm text-ink/50">{item.createdAt.slice(0, 10)}</span>
          </div>
        ))}
      </div>
      {items.length > 20 && (
        <p className="text-center text-sm text-ink/50">
          {t("notifications.showing")} {items.length} {t("notifications.alerts")}
        </p>
      )}
    </main>
  );
}
