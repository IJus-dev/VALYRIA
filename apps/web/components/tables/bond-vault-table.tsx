"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

export interface BondVaultRow {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  state: string;
}

const columns: ColumnDef<BondVaultRow, unknown>[] = [
  {
    accessorKey: "id",
    header: "Bond",
    cell: ({ row }) => (
      <span className="text-dusk">{row.getValue("id")}</span>
    ),
  },
  {
    accessorKey: "userId",
    header: "User",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) =>
      `${(row.getValue<number>("amount")).toLocaleString("pt-BR")} ${row.original.currency}`,
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => (
      <span className="text-moss">{row.getValue("state")}</span>
    ),
  },
];

interface BondVaultTableProps {
  data: BondVaultRow[];
}

export function BondVaultTable({ data }: BondVaultTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
