"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { postBackoffice } from "@/lib/backoffice-client";
import type { RedeemListItem, UserListItem } from "@/lib/platform-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface RedeemRequestFormProps {
  offerId: string;
  holders: UserListItem[];
  settlementWallet: string;
}

export function RedeemRequestForm({ offerId, holders, settlementWallet }: RedeemRequestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [holderId, setHolderId] = useState(holders[0]?.id ?? "");
  const [responseWindowDays, setResponseWindowDays] = useState("5");
  const [walletSeed, setWalletSeed] = useState("");

  return (
    <Card className="p-6">
      <h2 className="text-2xl text-dusk">Solicitar redeem</h2>
      {holders.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-ink/72">
          O redeem só fica disponível depois que a oferta estiver preenchida e associada ao holder atual.
        </p>
      ) : null}
      <div className="mt-4 grid gap-3">
        <Select value={holderId} onChange={(event) => setHolderId(event.target.value)}>
          {holders.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name ?? user.email}
            </option>
          ))}
        </Select>
        <Input value={settlementWallet} readOnly />
        <Input
          placeholder="Seed da wallet holder (opcional para testnet)"
          value={walletSeed}
          onChange={(event) => setWalletSeed(event.target.value)}
        />
        <Input
          placeholder="Janela de resposta em dias"
          value={responseWindowDays}
          onChange={(event) => setResponseWindowDays(event.target.value)}
        />
        <Button
          disabled={isPending || !holderId || !settlementWallet}
          onClick={() => {
            startTransition(async () => {
              const result = await postBackoffice<{ redeem: RedeemListItem }>(`offers/${offerId}/redeem`, {
                holderId,
                settlementWallet,
                responseWindowDays: Number(responseWindowDays),
                ...(walletSeed ? { walletSeed } : {})
              });

              if (!result.ok) {
                toast.error(result.message);
                return;
              }

              toast.success(
                result.payload.redeem.settlementLedgerHash
                  ? `Redeem criado: ${result.payload.redeem.id} :: settlement ${result.payload.redeem.settlementLedgerHash}`
                  : `Redeem criado: ${result.payload.redeem.id}`
              );
              router.refresh();
            });
          }}
        >
          {isPending ? "Solicitando..." : "Solicitar redeem"}
        </Button>
      </div>
    </Card>
  );
}

interface RedeemTransitionFormProps {
  redeems: RedeemListItem[];
}

export function RedeemTransitionForm({ redeems }: RedeemTransitionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [redeemId, setRedeemId] = useState(redeems[0]?.id ?? "");
  const [event, setEvent] = useState("ship");
  const [trackingCode, setTrackingCode] = useState("");

  return (
    <Card className="p-6">
      <h2 className="text-2xl text-dusk">Mover redeem</h2>
      <div className="mt-4 grid gap-3">
        <Select value={redeemId} onChange={(eventTarget) => setRedeemId(eventTarget.target.value)}>
          {redeems.map((redeem) => (
            <option key={redeem.id} value={redeem.id}>
              {redeem.id} :: {redeem.state}
            </option>
          ))}
        </Select>
        <Select value={event} onChange={(eventTarget) => setEvent(eventTarget.target.value)}>
          {["attach_tracking", "ship", "confirm_delivery", "accept", "open_dispute", "close"].map((eventName) => (
            <option key={eventName} value={eventName}>
              {eventName}
            </option>
          ))}
        </Select>
        {event === "attach_tracking" ? (
          <Input
            placeholder="Código de rastreio"
            value={trackingCode}
            onChange={(eventTarget) => setTrackingCode(eventTarget.target.value)}
          />
        ) : null}
        <Button
          disabled={isPending || !redeemId || (event === "attach_tracking" && trackingCode.trim().length < 4)}
          variant="ghost"
          onClick={() => {
            startTransition(async () => {
              const result = await postBackoffice<{ redeem: RedeemListItem }>(`redeems/${redeemId}/transition`, {
                event,
                ...(event === "attach_tracking" ? { trackingCode } : {})
              });

              if (!result.ok) {
                toast.error(result.message);
                return;
              }

              toast.success(
                result.payload.redeem.trackingCode
                  ? `Redeem ${result.payload.redeem.id} em ${result.payload.redeem.state} :: ${result.payload.redeem.trackingCode}`
                  : `Redeem ${result.payload.redeem.id} em ${result.payload.redeem.state}.`
              );
              router.refresh();
            });
          }}
        >
          {isPending ? "Atualizando..." : "Atualizar redeem"}
        </Button>
      </div>
    </Card>
  );
}

export function RedeemAutoAcceptForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [referenceTime, setReferenceTime] = useState("");

  return (
    <Card className="p-6">
      <h2 className="text-2xl text-dusk">Sweep de auto-accept</h2>
      <div className="mt-4 grid gap-3">
        <Input
          placeholder="Referência opcional em ISO datetime"
          value={referenceTime}
          onChange={(event) => setReferenceTime(event.target.value)}
        />
        <Button
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await postBackoffice<{ processed: number }>("redeems/auto-accept-expired", {
                ...(referenceTime ? { referenceTime } : {})
              });

              if (!result.ok) {
                toast.error(result.message);
                return;
              }

              toast.success(`Sweep concluído: ${result.payload.processed} redeem(s) processados.`);
              router.refresh();
            });
          }}
        >
          {isPending ? "Processando..." : "Rodar sweep"}
        </Button>
      </div>
    </Card>
  );
}
