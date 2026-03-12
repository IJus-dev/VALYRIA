"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useLocale } from "@/lib/locale-context";

export interface BondVaultRow {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  state: string;
}

interface BondVaultTableProps {
  data: BondVaultRow[];
}

export function BondVaultTable({ data }: BondVaultTableProps) {
  const { t, locale } = useLocale();

  const columns: ColumnDef<BondVaultRow, unknown>[] = [
    {
      accessorKey: "id",
      header: t("table.bond"),
      cell: ({ row }) => (
        <span className="text-dusk">{row.getValue("id")}</span>
      ),
    },
    {
      accessorKey: "userId",
      header: t("table.user"),
    },
    {
      accessorKey: "amount",
      header: t("table.amount"),
      cell: ({ row }) =>
        `${(row.getValue<number>("amount")).toLocaleString(locale)} ${row.original.currency}`,
    },
    {
      accessorKey: "state",
      header: t("table.state"),
      cell: ({ row }) => (
        <span className="text-moss">{row.getValue("state")}</span>
      ),
    },
  ];

  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
