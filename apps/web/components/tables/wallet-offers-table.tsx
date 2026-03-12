"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

export interface WalletOfferRow {
  id: string;
  seriesAlias: string;
  status: string;
  notional: number;
}

const columns: ColumnDef<WalletOfferRow, unknown>[] = [
  {
    accessorKey: "seriesAlias",
    header: "Series",
    cell: ({ row }) => (
      <span className="text-dusk">{row.getValue("seriesAlias")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="text-moss">{row.getValue("status")}</span>
    ),
  },
  {
    accessorKey: "notional",
    header: "Notional",
    cell: ({ row }) =>
      `R$ ${(row.getValue<number>("notional")).toLocaleString("pt-BR")}`,
  },
];

interface WalletOffersTableProps {
  data: WalletOfferRow[];
}

export function WalletOffersTable({ data }: WalletOffersTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
