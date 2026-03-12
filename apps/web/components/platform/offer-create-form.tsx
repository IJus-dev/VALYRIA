"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { buildSeriesAlias, encodeSeriesCurrencyCode } from "@valyria/domain";
import { postBackoffice } from "@/lib/backoffice-client";
import { offerCreateSchema, type OfferCreateInput } from "@/lib/schemas/offer-create";
import type { OfferListItem, UserListItem } from "@/lib/platform-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLocale } from "@/lib/locale-context";

interface OfferCreateFormProps {
  users: UserListItem[];
}

export function OfferCreateForm({ users }: OfferCreateFormProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const producers = users.filter((user) => user.state === "producer_approved");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OfferCreateInput>({
    resolver: zodResolver(offerCreateSchema),
    defaultValues: {
      producerId: producers[0]?.id ?? "",
      commodity: "MLH",
      region: "MT",
      year: 2026,
      cycle: "Q3",
      grade: "G1",
      lotUnit: "01",
      sequence: 11,
      quantity: 10000,
      unitPrice: 61.25,
      expiresAt: "2026-12-15T00:00",
      walletSeed: "",
    },
  });

  const [commodity, region, year, cycle, grade, lotUnit, sequence] = watch([
    "commodity",
    "region",
    "year",
    "cycle",
    "grade",
    "lotUnit",
    "sequence",
  ]);

  const descriptor = useMemo(
    () => ({
      commodity: String(commodity).slice(0, 3).toUpperCase(),
      region: String(region).slice(0, 2).toUpperCase(),
      year: Number(year),
      cycle: String(cycle).slice(0, 2).toUpperCase(),
      grade: String(grade).slice(0, 2).toUpperCase(),
      lotUnit: String(lotUnit).slice(0, 2).toUpperCase(),
      sequence: Number(sequence),
    }),
    [commodity, region, year, cycle, grade, lotUnit, sequence]
  );

  const alias = useMemo(() => {
    try {
      return buildSeriesAlias(descriptor);
    } catch {
      return t("offerCreate.invalidDescriptor");
    }
  }, [descriptor, t]);

  const currencyHex = useMemo(() => {
    try {
      return encodeSeriesCurrencyCode(descriptor);
    } catch {
      return t("offerCreate.invalidCurrencyHex");
    }
  }, [descriptor, t]);

  const onSubmit = (data: OfferCreateInput) => {
    startTransition(async () => {
      const result = await postBackoffice<OfferListItem>("offers", {
        producerId: data.producerId,
        quantity: Number(data.quantity),
        unitPrice: Number(data.unitPrice),
        expiresAt: new Date(data.expiresAt).toISOString(),
        descriptor,
        ...(data.walletSeed ? { walletSeed: data.walletSeed } : {}),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(
        result.payload.executionLane === "xrpl_dex"
          ? `${t("offerCreate.createdXrpl")}${result.payload.series.alias}${result.payload.ledgerHash ? ` (${result.payload.ledgerHash})` : ""}`
          : `${t("offerCreate.createdLocal")}${result.payload.series.alias}`
      );
      router.push(`/offers/${result.payload.id}`);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="p-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2 className="text-3xl text-dusk">{t("offerCreate.heading")}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <Select {...register("producerId")}>
                {producers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? user.email}
                  </option>
                ))}
              </Select>
              {errors.producerId && <p className="text-sm text-red-500">{errors.producerId.message}</p>}
            </div>
            <div>
              <Input {...register("commodity")} />
              {errors.commodity && <p className="text-sm text-red-500">{errors.commodity.message}</p>}
            </div>
            <div>
              <Input {...register("region")} />
              {errors.region && <p className="text-sm text-red-500">{errors.region.message}</p>}
            </div>
            <div>
              <Input {...register("year")} />
              {errors.year && <p className="text-sm text-red-500">{errors.year.message}</p>}
            </div>
            <div>
              <Input {...register("cycle")} />
              {errors.cycle && <p className="text-sm text-red-500">{errors.cycle.message}</p>}
            </div>
            <div>
              <Input {...register("grade")} />
              {errors.grade && <p className="text-sm text-red-500">{errors.grade.message}</p>}
            </div>
            <div>
              <Input {...register("lotUnit")} />
              {errors.lotUnit && <p className="text-sm text-red-500">{errors.lotUnit.message}</p>}
            </div>
            <div>
              <Input {...register("sequence")} />
              {errors.sequence && <p className="text-sm text-red-500">{errors.sequence.message}</p>}
            </div>
            <div>
              <Input {...register("quantity")} />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
            </div>
            <div>
              <Input {...register("unitPrice")} />
              {errors.unitPrice && <p className="text-sm text-red-500">{errors.unitPrice.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Input type="datetime-local" {...register("expiresAt")} />
              {errors.expiresAt && <p className="text-sm text-red-500">{errors.expiresAt.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Input
                type="password"
                placeholder={t("offerCreate.seedPlaceholder")}
                {...register("walletSeed")}
              />
            </div>
          </div>

          <Button className="mt-6" type="submit" disabled={isPending}>
            {isPending ? t("offerCreate.publishing") : t("offerCreate.publish")}
          </Button>
        </form>
      </Card>

      <div className="grid gap-6">
        <Card className="p-6">
          <span className="eyebrow">{t("offerCreate.seriesPreview")}</span>
          <h3 className="mt-4 text-3xl text-dusk">{alias}</h3>
          <div className="mt-4 rounded-tile border border-line/45 bg-dusk p-4 font-mono text-xs text-sand">{currencyHex}</div>
        </Card>
      </div>
    </div>
  );
}
