"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { postBackoffice } from "@/lib/backoffice-client";
import {
  disputeOpenSchema,
  type DisputeOpenInput,
  disputeTransitionSchema,
  type DisputeTransitionInput,
} from "@/lib/schemas/dispute-open";
import type { DisputeListItem, RedeemListItem, UserListItem } from "@/lib/platform-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface DisputeOpenFormProps {
  redeems: RedeemListItem[];
  users: UserListItem[];
}

export function DisputeOpenForm({ redeems, users }: DisputeOpenFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DisputeOpenInput>({
    resolver: zodResolver(disputeOpenSchema),
    defaultValues: {
      redeemId: redeems[0]?.id ?? "",
      openedByUserId: users[0]?.id ?? "",
      reason: "Divergência de qualidade na entrega.",
      evidenceUri: "ipfs://",
    },
  });

  const onSubmit = (data: DisputeOpenInput) => {
    startTransition(async () => {
      const result = await postBackoffice<DisputeListItem>("disputes", {
        redeemId: data.redeemId,
        openedByUserId: data.openedByUserId,
        reason: data.reason,
        ...(data.evidenceUri ? { evidenceUri: data.evidenceUri } : {}),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(`Disputa aberta: ${result.payload.id}`);
      router.refresh();
    });
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-2xl text-dusk">Abrir disputa</h2>
        <div className="mt-4 grid gap-3">
          <div>
            <Select {...register("redeemId")}>
              {redeems.map((redeem) => (
                <option key={redeem.id} value={redeem.id}>
                  {redeem.id} :: {redeem.state}
                </option>
              ))}
            </Select>
            {errors.redeemId && <p className="text-sm text-red-500">{errors.redeemId.message}</p>}
          </div>
          <div>
            <Select {...register("openedByUserId")}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name ?? user.email}
                </option>
              ))}
            </Select>
            {errors.openedByUserId && <p className="text-sm text-red-500">{errors.openedByUserId.message}</p>}
          </div>
          <div>
            <Textarea {...register("reason")} />
            {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
          </div>
          <div>
            <Input {...register("evidenceUri")} />
            {errors.evidenceUri && <p className="text-sm text-red-500">{errors.evidenceUri.message}</p>}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Abrindo..." : "Abrir disputa"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface DisputeTransitionFormProps {
  disputes: DisputeListItem[];
}

export function DisputeTransitionForm({ disputes }: DisputeTransitionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DisputeTransitionInput>({
    resolver: zodResolver(disputeTransitionSchema),
    defaultValues: {
      disputeId: disputes[0]?.id ?? "",
      event: "start_review",
      bondDecision: "restore_lock",
      slashPercentage: 10,
      resolutionSummary: "Conclusão operacional registrada.",
    },
  });

  const event = watch("event");
  const bondDecision = watch("bondDecision");

  const onSubmit = (data: DisputeTransitionInput) => {
    startTransition(async () => {
      const result = await postBackoffice<{ dispute: DisputeListItem }>(`disputes/${data.disputeId}/transition`, {
        event: data.event,
        ...(data.event === "resolve" || data.event === "reject"
          ? {
              bondDecision: data.bondDecision,
              resolutionSummary: data.resolutionSummary,
              ...(data.bondDecision === "slash_partial" ? { slashPercentage: data.slashPercentage } : {}),
            }
          : {}),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(`Disputa ${result.payload.dispute.id} em ${result.payload.dispute.state}.`);
      router.refresh();
    });
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-2xl text-dusk">Mover disputa</h2>
        <div className="mt-4 grid gap-3">
          <div>
            <Select {...register("disputeId")}>
              {disputes.map((dispute) => (
                <option key={dispute.id} value={dispute.id}>
                  {dispute.id} :: {dispute.tier} :: {dispute.state}
                </option>
              ))}
            </Select>
            {errors.disputeId && <p className="text-sm text-red-500">{errors.disputeId.message}</p>}
          </div>
          <div>
            <Select {...register("event")}>
              {["start_review", "escalate", "resolve", "reject"].map((eventName) => (
                <option key={eventName} value={eventName}>
                  {eventName}
                </option>
              ))}
            </Select>
            {errors.event && <p className="text-sm text-red-500">{errors.event.message}</p>}
          </div>
          {event === "resolve" || event === "reject" ? (
            <>
              <div>
                <Select {...register("bondDecision")}>
                  {["restore_lock", "slash_partial", "forfeit"].map((decision) => (
                    <option key={decision} value={decision}>
                      {decision}
                    </option>
                  ))}
                </Select>
                {errors.bondDecision && <p className="text-sm text-red-500">{errors.bondDecision.message}</p>}
              </div>
              {bondDecision === "slash_partial" ? (
                <div>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    placeholder="% do bond a ser slashado (1-100)"
                    {...register("slashPercentage")}
                  />
                  {errors.slashPercentage && <p className="text-sm text-red-500">{errors.slashPercentage.message}</p>}
                </div>
              ) : null}
              <div>
                <Textarea {...register("resolutionSummary")} />
                {errors.resolutionSummary && <p className="text-sm text-red-500">{errors.resolutionSummary.message}</p>}
              </div>
            </>
          ) : null}
          <Button variant="ghost" type="submit" disabled={isPending}>
            {isPending ? "Atualizando..." : "Atualizar disputa"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
