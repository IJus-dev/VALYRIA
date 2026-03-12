"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useLocale } from "@/lib/locale-context";

export interface WalletOfferRow {
  id: string;
  seriesAlias: string;
  status: string;
  notional: number;
}

interface WalletOffersTableProps {
  data: WalletOfferRow[];
}

export function WalletOffersTable({ data }: WalletOffersTableProps) {
  const { t, locale } = useLocale();

  const columns: ColumnDef<WalletOfferRow, unknown>[] = [
    {
      accessorKey: "seriesAlias",
      header: t("table.series"),
      cell: ({ row }) => (
        <span className="text-dusk">{row.getValue("seriesAlias")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: t("table.status"),
      cell: ({ row }) => (
        <span className="text-moss">{row.getValue("status")}</span>
      ),
    },
    {
      accessorKey: "notional",
      header: t("table.notional"),
      cell: ({ row }) =>
        `R$ ${(row.getValue<number>("notional")).toLocaleString(locale)}`,
    },
  ];

  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
