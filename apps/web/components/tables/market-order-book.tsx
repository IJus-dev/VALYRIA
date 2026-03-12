"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

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

const columns: ColumnDef<MarketOrderRow, unknown>[] = [
  {
    accessorKey: "series",
    header: "Série",
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
    header: "Quantidade",
    cell: ({ row }) =>
      (row.getValue<number>("quantity")).toLocaleString("pt-BR"),
  },
  {
    accessorKey: "unitPrice",
    header: "Preço unit.",
    cell: ({ row }) =>
      `R$ ${(row.getValue<number>("unitPrice")).toFixed(2)}`,
  },
  {
    accessorKey: "notional",
    header: "Notional",
    cell: ({ row }) =>
      `R$ ${(row.getValue<number>("notional")).toLocaleString("pt-BR")}`,
  },
  {
    accessorKey: "executionLane",
    header: "Lane",
    cell: ({ row }) =>
      row.getValue("executionLane") === "xrpl_dex" ? "XRPL DEX" : "local",
  },
  {
    accessorKey: "expiresAt",
    header: "Expira em",
    cell: ({ row }) =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(row.getValue<string>("expiresAt"))),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="text-moss">{row.getValue("status")}</span>
    ),
  },
];

interface MarketOrderBookProps {
  data: MarketOrderRow[];
}

export function MarketOrderBook({ data }: MarketOrderBookProps) {
  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
