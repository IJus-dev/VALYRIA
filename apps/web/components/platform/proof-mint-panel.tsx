"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { postBackoffice } from "@/lib/backoffice-client";
import type { ProofListItem } from "@/lib/platform-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ProofMintPanelProps {
  proof: ProofListItem;
}

export function ProofMintPanel({ proof }: ProofMintPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [walletSeed, setWalletSeed] = useState("");

  return (
    <Card className="p-6">
      <span className="eyebrow">XRPL mint</span>
      <h2 className="mt-4 text-3xl text-dusk">
        {proof.nftTokenId ? "Proof NFT já ancorada" : "Mintar Proof NFT"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink/72">
        O mint usa a wallet do owner da prova. Se essa wallet for uma conta de teste já configurada no `.env`,
        a seed pode ficar em branco.
      </p>
      <div className="mt-4 grid gap-3">
        <Input
          type="password"
          value={walletSeed}
          placeholder="Seed da wallet do owner"
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
                  ? `NFT mintada: ${result.payload.proof.nftTokenId}`
                  : "Mint concluído."
              );
              router.refresh();
            });
          }}
        >
          {isPending ? "Mintando..." : proof.nftTokenId ? "NFT mintada" : "Mintar na XRPL"}
        </Button>
      </div>
    </Card>
  );
}
