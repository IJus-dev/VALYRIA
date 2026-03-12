"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useLocale } from "@/lib/locale-context";

export interface AdminOfferRow {
  id: string;
  seriesAlias: string;
  status: string;
  producerName: string;
  executionLane: string;
  proofCount: number;
  redeemCount: number;
  latestEvent: string;
}

interface AdminOffersTableProps {
  data: AdminOfferRow[];
}

export function AdminOffersTable({ data }: AdminOffersTableProps) {
  const { t, locale } = useLocale();

  const columns: ColumnDef<AdminOfferRow, unknown>[] = [
    {
      accessorKey: "seriesAlias",
      header: t("table.series"),
      cell: ({ row }) => (
        <div>
          <Link
            href={`/offers/${row.original.id}`}
            className="text-sm font-medium text-dusk"
          >
            {row.original.seriesAlias}
          </Link>
          <div className="text-sm text-moss">{row.original.status}</div>
        </div>
      ),
    },
    {
      accessorKey: "producerName",
      header: t("table.producer"),
    },
    {
      accessorKey: "executionLane",
      header: t("table.lane"),
      cell: ({ row }) =>
        row.getValue("executionLane") === "xrpl_dex" ? t("table.xrplDex") : t("table.local"),
    },
    {
      accessorKey: "proofCount",
      header: t("table.proofs"),
    },
    {
      accessorKey: "redeemCount",
      header: t("table.redeems"),
    },
    {
      accessorKey: "latestEvent",
      header: t("table.lastEvent"),
    },
  ];

  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
