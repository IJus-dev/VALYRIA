"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { postBackoffice } from "@/lib/backoffice-client";
import type { ProofListItem } from "@/lib/platform-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale-context";

interface ProofMintPanelProps {
  proof: ProofListItem;
}

export function ProofMintPanel({ proof }: ProofMintPanelProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [walletSeed, setWalletSeed] = useState("");

  return (
    <Card className="p-6">
      <span className="eyebrow">{t("proofMint.eyebrow")}</span>
      <h2 className="mt-4 text-3xl text-dusk">
        {proof.nftTokenId ? t("proofMint.alreadyAnchored") : t("proofMint.mintHeading")}
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink/72">
        {t("proofMint.desc")}
      </p>
      <div className="mt-4 grid gap-3">
        <Input
          type="password"
          value={walletSeed}
          placeholder={t("proofMint.seedPlaceholder")}
          onChange={(event) => setWalletSeed(event.target.value)}
        />
        <Button
          disabled={isPending || Boolean(proof.nftTokenId)}
          onClick={() => {
            startTransition(async () => {
              const result = await postBackoffice<{ proof: ProofListItem }>(`proofs/${proof.id}/mint`, {
                ...(walletSeed ? { walletSeed } : {})
              });

              if (!result.ok) {
                toast.error(result.message);
                return;
              }

              toast.success(
                result.payload.proof.nftTokenId
                  ? `${t("proofMint.nftMinted")}: ${result.payload.proof.nftTokenId}`
                  : "Mint concluído."
              );
              router.refresh();
            });
          }}
        >
          {isPending ? t("proofMint.minting") : proof.nftTokenId ? t("proofMint.nftMinted") : t("proofMint.mintOnXrpl")}
        </Button>
      </div>
    </Card>
  );
}
