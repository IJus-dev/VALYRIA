import { getUsers } from "@/lib/api";
import { getLocale } from "@/lib/get-locale";
import { getWebDictionary } from "@valyria/i18n/web";
import { OfferCreateForm } from "@/components/platform/offer-create-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";

export default async function NewOfferPage() {
  const locale = getLocale();
  const dict = getWebDictionary(locale);
  const t = (key: string) => dict[key] ?? key;

  const users = await getUsers();

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow={t("offers.new.eyebrow")}
          heading={t("offers.new.heading")}
        />
      </section>

      <OfferCreateForm users={users} />

    </main>
  );
}
