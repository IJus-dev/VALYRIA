"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { postBackoffice } from "@/lib/backoffice-client";
import { proofCreateSchema, type ProofCreateInput } from "@/lib/schemas/proof-create";
import type { OfferListItem, ProofListItem, UserListItem } from "@/lib/platform-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ProofCreateFormProps {
  users: UserListItem[];
  offers: OfferListItem[];
}

export function ProofCreateForm({ users, offers }: ProofCreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mintOnLedger, setMintOnLedger] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProofCreateInput>({
    resolver: zodResolver(proofCreateSchema),
    defaultValues: {
      userId: users[0]?.id ?? "",
      offerId: offers[0]?.id ?? "",
      artifactType: "underwriting_report",
      commodity: "MLH",
      uri: "ipfs://",
      ipfsCid: "",
      metadata: '{"source":"manual"}',
      walletSeed: "",
    },
  });

  const uri = watch("uri");
  const ipfsCid = watch("ipfsCid");

  const onSubmit = (data: ProofCreateInput) => {
    startTransition(async () => {
      let parsedMetadata: Record<string, string | number | boolean> | undefined;

      try {
        parsedMetadata = data.metadata ? (JSON.parse(data.metadata) as Record<string, string | number | boolean>) : undefined;
      } catch {
        toast.error("Metadata JSON inválido.");
        return;
      }

      const resolvedUri = data.uri.trim() || (data.ipfsCid ? `ipfs://${data.ipfsCid}` : "");

      if (!resolvedUri) {
        toast.error("Informe uma URI ou um CID de IPFS.");
        return;
      }

      const result = await postBackoffice<ProofListItem>("proofs", {
        userId: data.userId,
        offerId: data.offerId,
        artifactType: data.artifactType,
        commodity: data.commodity,
        uri: resolvedUri,
        ...(data.ipfsCid ? { ipfsCid: data.ipfsCid } : {}),
        ...(parsedMetadata ? { metadata: parsedMetadata } : {}),
        ...(mintOnLedger ? { mintOnLedger: true } : {}),
        ...(data.walletSeed ? { walletSeed: data.walletSeed } : {}),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(
        result.payload.nftTokenId
          ? `Proof criada e mintada: ${result.payload.nftTokenId}`
          : `Proof criada: ${result.payload.id}`
      );
      router.refresh();
    });
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-2xl text-dusk">Registrar prova</h2>
        <div className="mt-4 grid gap-3">
          <div>
            <Select {...register("userId")}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name ?? user.email}
                </option>
              ))}
            </Select>
            {errors.userId && <p className="text-sm text-red-500">{errors.userId.message}</p>}
          </div>
          <div>
            <Select {...register("offerId")}>
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.series.alias}
                </option>
              ))}
            </Select>
            {errors.offerId && <p className="text-sm text-red-500">{errors.offerId.message}</p>}
          </div>
          <div>
            <Select {...register("artifactType")}>
              {["underwriting_report", "farm_document", "geo_photo", "delivery_receipt", "dispute_evidence"].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            {errors.artifactType && <p className="text-sm text-red-500">{errors.artifactType.message}</p>}
          </div>
          <div>
            <Input {...register("commodity")} />
            {errors.commodity && <p className="text-sm text-red-500">{errors.commodity.message}</p>}
          </div>
          <div>
            <Input {...register("uri")} />
            {errors.uri && <p className="text-sm text-red-500">{errors.uri.message}</p>}
          </div>
          <div>
            <Input {...register("ipfsCid")} />
          </div>
          <div>
            <Textarea {...register("metadata")} />
            {errors.metadata && <p className="text-sm text-red-500">{errors.metadata.message}</p>}
          </div>
          <label className="flex items-center gap-3 rounded-tile border border-line bg-paper/88 px-4 py-3 text-sm text-ink/72">
            <input type="checkbox" checked={mintOnLedger} onChange={(event) => setMintOnLedger(event.target.checked)} />
            Mintar Proof NFT na XRPL agora
          </label>
          {mintOnLedger ? (
            <div>
              <Input
                type="password"
                placeholder="Seed da wallet do owner (opcional se for wallet de teste do .env)"
                {...register("walletSeed")}
              />
            </div>
          ) : null}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Registrando..." : "Registrar proof"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
