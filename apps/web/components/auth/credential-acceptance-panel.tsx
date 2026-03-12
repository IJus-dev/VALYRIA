"use client";

import { useEffect, useState, useTransition } from "react";
import type { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CredentialListItem, UserListItem } from "@/lib/platform-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLocale } from "@/lib/locale-context";

interface CredentialAcceptancePanelProps {
  session: Session | null;
}

interface AcceptCredentialResponse {
  credential: CredentialListItem;
  user: UserListItem;
  ledger?: {
    submitted: boolean;
    hash?: string;
  };
}

export function CredentialAcceptancePanel({ session }: CredentialAcceptancePanelProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [selectedCredentialId, setSelectedCredentialId] = useState("");
  const [ledgerCredentialId, setLedgerCredentialId] = useState("");
  const [walletSeed, setWalletSeed] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function loadCredentials() {
      if (!session?.user?.id) {
        setCredentials([]);
        setSelectedCredentialId("");
        return;
      }

      setIsLoading(true);

      const response = await fetch("/api/me/credentials", {
        cache: "no-store"
      });

      const payload = (await response.json()) as {
        items?: CredentialListItem[];
        message?: string;
      };

      if (!isMounted) {
        return;
      }

      if (!response.ok) {
        toast.error(payload.message ?? "Falha ao carregar credenciais.");
        setCredentials([]);
        setSelectedCredentialId("");
        setIsLoading(false);
        return;
      }

      const nextCredentials = payload.items ?? [];
      const nextPending = nextCredentials.find((credential) => credential.status === "created");

      setCredentials(nextCredentials);
      setSelectedCredentialId(nextPending?.id ?? nextCredentials[0]?.id ?? "");
      setIsLoading(false);
    }

    void loadCredentials();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  const pendingCredentials = credentials.filter((credential) => credential.status === "created");
  const acceptedCredentials = credentials.filter((credential) => credential.status === "accepted");
  const selectedCredential = credentials.find((credential) => credential.id === selectedCredentialId);
  const hasLedgerCredentialReference = Boolean(selectedCredential?.ledgerCredentialId || ledgerCredentialId);

  return (
    <Card tone="soft" className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl text-dusk">{t("credentialAcceptance.heading")}</h3>
          <p className="mt-2 body-copy">
            {t("credentialAcceptance.desc")}
          </p>
        </div>
        <Badge variant="outline">{t("credentialAcceptance.badge")}</Badge>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-tile border border-line/45 bg-sand/35 p-4">
            <div className="label-caps">{t("credentialAcceptance.pending")}</div>
            <div className="mt-2 text-3xl text-dusk">{pendingCredentials.length}</div>
          </div>
          <div className="rounded-tile border border-line/45 bg-sand/35 p-4">
            <div className="label-caps">{t("credentialAcceptance.accepted")}</div>
            <div className="mt-2 text-3xl text-dusk">{acceptedCredentials.length}</div>
          </div>
        </div>

        {!session?.user?.id ? (
          <p className="body-copy">{t("credentialAcceptance.loginFirst")}</p>
        ) : isLoading ? (
          <p className="body-copy">{t("credentialAcceptance.loading")}</p>
        ) : credentials.length === 0 ? (
          <p className="body-copy">{t("credentialAcceptance.noCredentials")}</p>
        ) : (
          <>
            <div className="grid gap-3">
              {credentials.map((credential) => (
                <div key={credential.id} className="rounded-tile border border-line/45 bg-sand/35 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{credential.kind}</Badge>
                    <Badge variant="outline">{credential.status}</Badge>
                  </div>
                  <div className="mt-3 body-copy">{credential.id}</div>
                  <div className="mt-2 body-copy">
                    {t("credentialAcceptance.wallet")}{credential.subjectWallet ?? session?.user?.walletAddress ?? t("credentialAcceptance.walletPending")}
                  </div>
                </div>
              ))}
            </div>

            {pendingCredentials.length > 0 ? (
              <>
                <Select
                  value={selectedCredentialId}
                  onChange={(event) => setSelectedCredentialId(event.target.value)}
                >
                  {pendingCredentials.map((credential) => (
                    <option key={credential.id} value={credential.id}>
                      {credential.kind} :: {credential.id}
                    </option>
                  ))}
                </Select>

                <Input
                  placeholder={t("credentialAcceptance.credentialIdPlaceholder")}
                  value={ledgerCredentialId}
                  onChange={(event) => setLedgerCredentialId(event.target.value)}
                />
                <Input
                  placeholder={t("credentialAcceptance.seedPlaceholder")}
                  value={walletSeed}
                  onChange={(event) => setWalletSeed(event.target.value)}
                />

                <Button
                  disabled={isPending || !selectedCredentialId || !hasLedgerCredentialReference}
                  onClick={() => {
                    startTransition(async () => {
                      const response = await fetch(`/api/me/credentials/${selectedCredentialId}/accept`, {
                        method: "POST",
                        headers: {
                          "content-type": "application/json"
                        },
                        body: JSON.stringify({
                          ...(ledgerCredentialId ? { ledgerCredentialId } : {}),
                          ...(walletSeed ? { walletSeed } : {})
                        })
                      });

                      const payload = (await response.json()) as
                        | AcceptCredentialResponse
                        | {
                            message?: string;
                          };

                      if (!response.ok) {
                        toast.error("message" in payload ? payload.message ?? "Falha ao aceitar credencial." : "Falha ao aceitar credencial.");
                        return;
                      }

                      const successPayload = payload as AcceptCredentialResponse;
                      setLedgerCredentialId("");
                      setWalletSeed("");
                      toast.success(
                        successPayload.ledger?.submitted
                          ? `Credencial aceita em testnet; estado atual: ${successPayload.user.state}. hash=${successPayload.ledger.hash ?? "n/a"}`
                          : `Credencial aceita; estado atual: ${successPayload.user.state}.`
                      );
                      router.refresh();

                      const refreshResponse = await fetch("/api/me/credentials", {
                        cache: "no-store"
                      });
                      const refreshPayload = (await refreshResponse.json()) as {
                        items?: CredentialListItem[];
                      };
                      const nextCredentials = refreshPayload.items ?? [];
                      const nextPending = nextCredentials.find((credential) => credential.status === "created");

                      setCredentials(nextCredentials);
                      setSelectedCredentialId(nextPending?.id ?? nextCredentials[0]?.id ?? "");
                    });
                  }}
                >
                  {isPending ? t("credentialAcceptance.accepting") : t("credentialAcceptance.accept")}
                </Button>
              </>
            ) : (
              <p className="body-copy">{t("credentialAcceptance.noPending")}</p>
            )}
          </>
        )}

      </div>
    </Card>
  );
}
