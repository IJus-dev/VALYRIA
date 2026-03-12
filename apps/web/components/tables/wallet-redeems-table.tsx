"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

export interface WalletRedeemRow {
  id: string;
  offerId: string;
  state: string;
  responseWindowDays: number;
}

const columns: ColumnDef<WalletRedeemRow, unknown>[] = [
  {
    accessorKey: "offerId",
    header: "Redeem",
    cell: ({ row }) => (
      <span className="text-dusk">{row.getValue("offerId")}</span>
    ),
  },
  {
    accessorKey: "state",
    header: "Estado",
    cell: ({ row }) => (
      <span className="text-moss">{row.getValue("state")}</span>
    ),
  },
  {
    accessorKey: "responseWindowDays",
    header: "Janela",
    cell: ({ row }) =>
      `${row.getValue<number>("responseWindowDays")} dias`,
  },
];

interface WalletRedeemsTableProps {
  data: WalletRedeemRow[];
}

export function WalletRedeemsTable({ data }: WalletRedeemsTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
