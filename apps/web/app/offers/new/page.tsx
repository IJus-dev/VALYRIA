import { getUsers } from "@/lib/api";
import { OfferCreateForm } from "@/components/platform/offer-create-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";

export default async function NewOfferPage() {
  const users = await getUsers();

  return (
    <main className="flex flex-col gap-section pt-8">
      <section className="section-frame">
        <SectionHeading
          eyebrow="ORIGINATION DESK"
          heading="Publicar nova oferta."
        />
      </section>

      <OfferCreateForm users={users} />

    </main>
  );
}
