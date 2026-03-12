"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useLocale } from "@/lib/locale-context";

export interface MarketOrderRow {
  id: string;
  series: string;
  quantity: number;
  unitPrice: number;
  notional: number;
  executionLane: string;
  expiresAt: string;
  status: string;
}

interface MarketOrderBookProps {
  data: MarketOrderRow[];
}

export function MarketOrderBook({ data }: MarketOrderBookProps) {
  const { t, locale } = useLocale();

  const columns: ColumnDef<MarketOrderRow, unknown>[] = [
    {
      accessorKey: "series",
      header: t("table.series"),
      cell: ({ row }) => (
        <Link
          href={`/offers/${row.original.id}`}
          className="font-medium text-dusk"
        >
          {row.original.series}
        </Link>
      ),
    },
    {
      accessorKey: "quantity",
      header: t("table.quantity"),
      cell: ({ row }) =>
        (row.getValue<number>("quantity")).toLocaleString(locale),
    },
    {
      accessorKey: "unitPrice",
      header: t("table.unitPrice"),
      cell: ({ row }) =>
        `R$ ${(row.getValue<number>("unitPrice")).toFixed(2)}`,
    },
    {
      accessorKey: "notional",
      header: t("table.notional"),
      cell: ({ row }) =>
        `R$ ${(row.getValue<number>("notional")).toLocaleString(locale)}`,
    },
    {
      accessorKey: "executionLane",
      header: t("table.lane"),
      cell: ({ row }) =>
        row.getValue("executionLane") === "xrpl_dex" ? t("table.xrplDex") : t("table.local"),
    },
    {
      accessorKey: "expiresAt",
      header: t("table.expiresIn"),
      cell: ({ row }) =>
        new Intl.DateTimeFormat(locale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(row.getValue<string>("expiresAt"))),
    },
    {
      accessorKey: "status",
      header: t("table.status"),
      cell: ({ row }) => (
        <span className="text-moss">{row.getValue("status")}</span>
      ),
    },
  ];

  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
