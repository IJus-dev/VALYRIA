"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { postBackoffice } from "@/lib/backoffice-client";
import { bondCreateSchema, type BondCreateInput, bondTransitionSchema, type BondTransitionInput } from "@/lib/schemas/bond-create";
import type { BondListItem, CredentialListItem, UserListItem } from "@/lib/platform-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLocale } from "@/lib/locale-context";

interface BondConsoleProps {
  users: UserListItem[];
  credentials: CredentialListItem[];
  bonds: BondListItem[];
}

export function BondConsole({ users, credentials, bonds }: BondConsoleProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /* ── Bond Create form ── */
  const createForm = useForm<BondCreateInput>({
    resolver: zodResolver(bondCreateSchema),
    defaultValues: {
      userId: users[0]?.id ?? "",
      amount: 1000,
      credentialIds: "",
      walletSeed: "",
    },
  });

  const createUserId = createForm.watch("userId");

  const acceptedByUser = useMemo(
    () => credentials.filter((credential) => credential.userId === createUserId && credential.status === "accepted"),
    [credentials, createUserId]
  );

  const onCreateSubmit = (data: BondCreateInput) => {
    startTransition(async () => {
      const result = await postBackoffice<{
        bond: BondListItem;
        ledger: {
          submitted: boolean;
          hash?: string;
        };
      }>("bonds", {
        userId: data.userId,
        amount: Number(data.amount),
        credentialIds: data.credentialIds
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        ...(data.walletSeed ? { walletSeed: data.walletSeed } : {}),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      createForm.setValue("walletSeed", "");
      toast.success(
        result.payload.ledger.submitted
          ? `${t("bondConsole.createdTestnet")}${result.payload.bond.id}. hash=${result.payload.ledger.hash ?? "n/a"}`
          : `${t("bondConsole.created")}${result.payload.bond.id}.`
      );
      router.refresh();
    });
  };

  /* ── Bond Transition form ── */
  const transitionForm = useForm<BondTransitionInput>({
    resolver: zodResolver(bondTransitionSchema),
    defaultValues: {
      bondId: bonds[0]?.id ?? "",
      event: "confirm_deposit",
    },
  });

  const onTransitionSubmit = (data: BondTransitionInput) => {
    startTransition(async () => {
      const result = await postBackoffice<BondListItem>(`bonds/${data.bondId}/transition`, {
        event: data.event,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(`${t("bondConsole.bondInState")}${result.payload.id} ${result.payload.state}`);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-4">
      <Card className="p-6">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
          <h2 className="text-2xl text-dusk">{t("bondConsole.createBond")}</h2>
          <div className="mt-4 grid gap-3">
            <div>
              <Select
                value={createUserId}
                onChange={(eventTarget) => {
                  createForm.setValue("userId", eventTarget.target.value);
                  createForm.setValue("credentialIds", "");
                }}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? user.email}
                  </option>
                ))}
              </Select>
              {createForm.formState.errors.userId && (
                <p className="text-sm text-red-500">{createForm.formState.errors.userId.message}</p>
              )}
            </div>
            <div>
              <Input placeholder={t("bondConsole.amountPlaceholder")} {...createForm.register("amount")} />
              {createForm.formState.errors.amount && (
                <p className="text-sm text-red-500">{createForm.formState.errors.amount.message}</p>
              )}
            </div>
            <div>
              <Input placeholder={t("bondConsole.credentialIdsPlaceholder")} {...createForm.register("credentialIds")} />
              {createForm.formState.errors.credentialIds && (
                <p className="text-sm text-red-500">{createForm.formState.errors.credentialIds.message}</p>
              )}
            </div>
            <div>
              <Input
                placeholder={t("bondConsole.seedPlaceholder")}
                {...createForm.register("walletSeed")}
              />
            </div>
            <div className="rounded-tile border border-dashed border-line/60 bg-sand/35 p-4 text-sm text-ink/72">
              {t("bondConsole.credentialsAccepted")}{acceptedByUser.map((credential) => credential.id).join(", ") || t("bondConsole.none")}
              . Em `XRPL_MODE=real`, a seed temporária deve corresponder à wallet do usuário selecionado.
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("bondConsole.creating") : t("bondConsole.createBond")}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <form onSubmit={transitionForm.handleSubmit(onTransitionSubmit)}>
          <h2 className="text-2xl text-dusk">{t("bondConsole.transitionBond")}</h2>
          <div className="mt-4 grid gap-3">
            <div>
              <Select {...transitionForm.register("bondId")}>
                {bonds.map((bond) => (
                  <option key={bond.id} value={bond.id}>
                    {bond.id} :: {bond.state}
                  </option>
                ))}
              </Select>
              {transitionForm.formState.errors.bondId && (
                <p className="text-sm text-red-500">{transitionForm.formState.errors.bondId.message}</p>
              )}
            </div>
            <div>
              <Select {...transitionForm.register("event")}>
                <option value="confirm_deposit">confirm_deposit</option>
                <option value="slash_partial">slash_partial</option>
                <option value="release">release</option>
                <option value="forfeit">forfeit</option>
              </Select>
              {transitionForm.formState.errors.event && (
                <p className="text-sm text-red-500">{transitionForm.formState.errors.event.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isPending} variant="ghost">
              {isPending ? t("bondConsole.applying") : t("bondConsole.transition")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
