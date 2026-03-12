"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { postBackoffice } from "@/lib/backoffice-client";
import { oraclePublishSchema, type OraclePublishInput } from "@/lib/schemas/oracle-publish";
import type { OracleListItem } from "@/lib/platform-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function OraclePublishForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OraclePublishInput>({
    resolver: zodResolver(oraclePublishSchema),
    defaultValues: {
      symbol: "MLH/BRL",
      source: "desk-manual",
      value: 62.10,
      scale: 2,
    },
  });

  const onSubmit = (data: OraclePublishInput) => {
    startTransition(async () => {
      const result = await postBackoffice<{
        price: OracleListItem;
        ledger?: {
          submitted: boolean;
          hash?: string;
        };
      }>("oracles", {
        symbol: data.symbol,
        source: data.source,
        value: Number(data.value),
        scale: Number(data.scale),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(
        result.payload.ledger?.submitted
          ? `Oracle publicado em testnet: ${result.payload.price.symbol} = ${result.payload.price.value}. hash=${result.payload.ledger.hash ?? "n/a"}`
          : `Oracle publicado: ${result.payload.price.symbol} = ${result.payload.price.value}`
      );
      router.refresh();
    });
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-2xl text-dusk">Publicar oracle price</h2>
        <div className="mt-4 grid gap-3">
          <div>
            <Input {...register("symbol")} />
            {errors.symbol && <p className="text-sm text-red-500">{errors.symbol.message}</p>}
          </div>
          <div>
            <Input {...register("source")} />
            {errors.source && <p className="text-sm text-red-500">{errors.source.message}</p>}
          </div>
          <div>
            <Input {...register("value")} />
            {errors.value && <p className="text-sm text-red-500">{errors.value.message}</p>}
          </div>
          <div>
            <Input {...register("scale")} />
            {errors.scale && <p className="text-sm text-red-500">{errors.scale.message}</p>}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Publicando..." : "Publicar feed"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
