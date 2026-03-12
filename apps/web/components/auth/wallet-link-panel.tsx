"use client";

import { useState, useTransition } from "react";
import type { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/locale-context";

interface WalletLinkPanelProps {
  session: Session | null;
}

export function WalletLinkPanel({ session }: WalletLinkPanelProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState(session?.user?.walletAddress ?? "");
  const [challengeId, setChallengeId] = useState("");
  const [challengeMessage, setChallengeMessage] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [signature, setSignature] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Card tone="soft" className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl text-dusk">{t("walletLink.heading")}</h3>
          <p className="mt-2 body-copy">
            {t("walletLink.desc")}
          </p>
        </div>
        <Badge variant="outline">{t("walletLink.badge")}</Badge>
      </div>

      <div className="mt-5 grid gap-4">
        <Input
          placeholder="r..."
          value={walletAddress}
          onChange={(event) => setWalletAddress(event.target.value)}
        />

        <Button
          disabled={isPending || !walletAddress || !session?.user.id}
          onClick={() => {
            startTransition(async () => {
              const response = await fetch("/api/me/wallet-challenges", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  userId: session?.user.id,
                  walletAddress
                })
              });

              const payload = (await response.json()) as {
                id?: string;
                message?: string;
              };

              if (!response.ok || !payload.id || !payload.message) {
                toast.error((payload as { message?: string }).message ?? "Falha ao criar challenge.");
                return;
              }

              setChallengeId(payload.id);
              setChallengeMessage(payload.message);
              toast.success("Challenge gerado. Assine a mensagem e cole abaixo.");
            });
          }}
        >
          {isPending ? t("walletLink.generating") : t("walletLink.generate")}
        </Button>

        <Textarea
          tone="soft"
          className="min-h-32"
          value={challengeMessage}
          readOnly
        />

        <Input
          placeholder={t("walletLink.publicKeyPlaceholder")}
          value={publicKey}
          onChange={(event) => setPublicKey(event.target.value)}
        />
        <Textarea
          className="min-h-24"
          placeholder={t("walletLink.signaturePlaceholder")}
          value={signature}
          onChange={(event) => setSignature(event.target.value)}
        />
        <Button
          disabled={isPending || !challengeId || !publicKey || !signature}
          variant="ghost"
          onClick={() => {
            startTransition(async () => {
              const response = await fetch("/api/me/wallet-verify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  challengeId,
                  signature,
                  publicKey
                })
              });

              const payload = (await response.json()) as { message?: string; user?: { walletAddress?: string } };

              if (!response.ok) {
                toast.error(payload.message ?? "Falha ao verificar assinatura.");
                return;
              }

              router.refresh();
              toast.success(`Wallet vinculada: ${payload.user?.walletAddress ?? walletAddress}`);
            });
          }}
        >
          {isPending ? t("walletLink.verifying") : t("walletLink.verify")}
        </Button>

      </div>
    </Card>
  );
}
