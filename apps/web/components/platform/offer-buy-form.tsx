"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { postBackoffice } from "@/lib/backoffice-client";
import type { OfferListItem, UserListItem } from "@/lib/platform-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLocale } from "@/lib/locale-context";

interface OfferBuyFormProps {
  offer: OfferListItem;
  holders: UserListItem[];
}

export function OfferBuyForm({ offer, holders }: OfferBuyFormProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [holderId, setHolderId] = useState(holders[0]?.id ?? "");
  const [walletSeed, setWalletSeed] = useState("");

  return (
    <Card className="p-6">
      <h2 className="text-2xl text-dusk">{t("offerBuy.heading")}</h2>
      <p className="mt-3 text-sm leading-6 text-ink/72">
        {t("offerBuy.desc")}
      </p>
      <div className="mt-4 grid gap-3">
        <Select
          value={holderId}
          onChange={(event) => setHolderId(event.target.value)}
        >
          {holders.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name ?? user.email}
            </option>
          ))}
        </Select>
        <Input
          type="password"
          placeholder={t("offerBuy.seedPlaceholder")}
          value={walletSeed}
          onChange={(event) => setWalletSeed(event.target.value)}
        />
        <Button
          disabled={isPending || !holderId || offer.status !== "listed"}
          onClick={() => {
            startTransition(async () => {
              const result = await postBackoffice<{ offer: OfferListItem }>(`offers/${offer.id}/buy`, {
                holderId,
                ...(walletSeed ? { walletSeed } : {})
              });

              if (!result.ok) {
                toast.error(result.message);
                return;
              }

              toast.success(
                `${t("offerBuy.filled")}${result.payload.offer.currentHolderId}${result.payload.offer.fillLedgerHash ? ` (${result.payload.offer.fillLedgerHash})` : ""}`
              );
              router.refresh();
            });
          }}
        >
          {isPending ? t("offerBuy.executing") : t("offerBuy.buy")}
        </Button>
      </div>
    </Card>
  );
}
