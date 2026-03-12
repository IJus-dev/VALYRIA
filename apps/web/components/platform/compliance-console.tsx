"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { postBackoffice } from "@/lib/backoffice-client";
import type { CredentialListItem, UserListItem } from "@/lib/platform-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLocale } from "@/lib/locale-context";

interface ComplianceConsoleProps {
  users: UserListItem[];
  credentials: CredentialListItem[];
}

export function ComplianceConsole({ users, credentials }: ComplianceConsoleProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [transitionUserId, setTransitionUserId] = useState(users[0]?.id ?? "");
  const [transitionEvent, setTransitionEvent] = useState("submit_kyc");
  const [walletAddress, setWalletAddress] = useState("");
  const [issueUserId, setIssueUserId] = useState(users[0]?.id ?? "");
  const [issueKind, setIssueKind] = useState("KYCApproved");
  const [credentialId, setCredentialId] = useState(credentials[0]?.id ?? "");
  const [ledgerCredentialId, setLedgerCredentialId] = useState("");
  const [acceptWalletSeed, setAcceptWalletSeed] = useState("");

  const issuableUsers = useMemo(() => users.filter((user) => user.walletAddress), [users]);

  return (
    <div className="grid gap-4">
      <Card className="p-6">
        <h2 className="text-2xl text-dusk">{t("compliance.createParticipant")}</h2>
        <div className="mt-4 grid gap-3">
          <Input
            placeholder={t("compliance.namePlaceholder")}
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
          />
          <Input
            placeholder={t("compliance.emailPlaceholder")}
            value={createEmail}
            onChange={(event) => setCreateEmail(event.target.value)}
          />
          <Button
            disabled={isPending || !createEmail}
            onClick={() => {
              startTransition(async () => {
                const result = await postBackoffice<UserListItem>("onboarding/users", {
                  email: createEmail,
                  ...(createName ? { name: createName } : {})
                });

                if (!result.ok) {
                  toast.error(result.message);
                  return;
                }

                setCreateEmail("");
                setCreateName("");
                toast.success(`${t("compliance.userCreated")}${result.payload.email}`);
                router.refresh();
              });
            }}
          >
            {isPending ? t("compliance.creating") : t("compliance.createUser")}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl text-dusk">{t("compliance.transitionState")}</h2>
        <div className="mt-4 grid gap-3">
          <Select
            value={transitionUserId}
            onChange={(event) => setTransitionUserId(event.target.value)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ?? user.email}
              </option>
            ))}
          </Select>
          <Select
            value={transitionEvent}
            onChange={(event) => setTransitionEvent(event.target.value)}
          >
            {[
              "verify_email",
              "link_wallet",
              "submit_kyc",
              "approve_kyc",
              "reject_kyc",
              "approve_producer",
              "suspend",
              "reinstate"
            ].map((eventName) => (
              <option key={eventName} value={eventName}>
                {eventName}
              </option>
            ))}
          </Select>
          <Input
            placeholder={t("compliance.walletPlaceholder")}
            value={walletAddress}
            onChange={(event) => setWalletAddress(event.target.value)}
          />
          <Button
            disabled={isPending || !transitionUserId}
            variant="ghost"
            onClick={() => {
              startTransition(async () => {
                const result = await postBackoffice<UserListItem>(`onboarding/users/${transitionUserId}/transition`, {
                  event: transitionEvent,
                  ...(transitionEvent === "link_wallet" && walletAddress ? { walletAddress } : {})
                });

                if (!result.ok) {
                  toast.error(result.message);
                  return;
                }

                toast.success(`Usuário atualizado para ${result.payload.state}.`);
                router.refresh();
              });
            }}
          >
            {isPending ? t("compliance.updating") : t("compliance.applyTransition")}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl text-dusk">{t("compliance.issueCredential")}</h2>
        <div className="mt-4 grid gap-3">
          <Select
            value={issueUserId}
            onChange={(event) => setIssueUserId(event.target.value)}
          >
            {issuableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ?? user.email}
              </option>
            ))}
          </Select>
          <Select
            value={issueKind}
            onChange={(event) => setIssueKind(event.target.value)}
          >
            <option value="KYCApproved">KYCApproved</option>
            <option value="ProducerApproved">ProducerApproved</option>
          </Select>
          <Button
            disabled={isPending || !issueUserId}
            onClick={() => {
              startTransition(async () => {
                const result = await postBackoffice<{
                  credential: CredentialListItem;
                  preview: {
                    issuerWallet: string;
                  };
                  ledger?: {
                    submitted: boolean;
                    hash?: string;
                  };
                }>("credentials", {
                  userId: issueUserId,
                  kind: issueKind
                });

                if (!result.ok) {
                  toast.error(result.message);
                  return;
                }

                toast.success(
                  result.payload.ledger?.submitted
                    ? `Credencial emitida on-ledger por ${result.payload.preview.issuerWallet}. hash=${result.payload.ledger.hash ?? "n/a"}`
                    : `Credencial emitida por ${result.payload.preview.issuerWallet}.`
                );
                router.refresh();
              });
            }}
          >
            {isPending ? t("compliance.issuing") : t("compliance.issueCredential")}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl text-dusk">{t("compliance.acceptCredential")}</h2>
        <div className="mt-4 grid gap-3">
          <Select
            value={credentialId}
            onChange={(event) => setCredentialId(event.target.value)}
          >
            {credentials.map((credential) => (
              <option key={credential.id} value={credential.id}>
                {credential.kind} :: {credential.id}
              </option>
            ))}
          </Select>
          <Input
            placeholder={t("compliance.credentialIdPlaceholder")}
            value={ledgerCredentialId}
            onChange={(event) => setLedgerCredentialId(event.target.value)}
          />
          <Input
            placeholder="seed temporária da wallet do usuário (somente testnet)"
            value={acceptWalletSeed}
            onChange={(event) => setAcceptWalletSeed(event.target.value)}
          />
          <Button
            disabled={isPending || !credentialId}
            variant="ghost"
            onClick={() => {
              startTransition(async () => {
                const result = await postBackoffice<{
                  credential: CredentialListItem;
                  user: UserListItem;
                  ledger?: {
                    submitted: boolean;
                    hash?: string;
                  };
                }>(`credentials/${credentialId}/accept`, {
                  ...(ledgerCredentialId ? { ledgerCredentialId } : {}),
                  ...(acceptWalletSeed ? { walletSeed: acceptWalletSeed } : {})
                });

                if (!result.ok) {
                  toast.error(result.message);
                  return;
                }

                setLedgerCredentialId("");
                setAcceptWalletSeed("");
                toast.success(
                  result.payload.ledger?.submitted
                    ? `Credencial aceita em testnet; usuário agora em ${result.payload.user.state}. hash=${result.payload.ledger.hash ?? "n/a"}`
                    : `Credencial aceita; usuário agora em ${result.payload.user.state}.`
                );
                router.refresh();
              });
            }}
          >
            {isPending ? t("compliance.accepting") : t("compliance.acceptCredential")}
          </Button>
        </div>
      </Card>

    </div>
  );
}
