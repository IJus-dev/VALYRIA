"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useLocale } from "@/lib/locale-context";

export interface WalletRedeemRow {
  id: string;
  offerId: string;
  state: string;
  responseWindowDays: number;
}

interface WalletRedeemsTableProps {
  data: WalletRedeemRow[];
}

export function WalletRedeemsTable({ data }: WalletRedeemsTableProps) {
  const { t, locale } = useLocale();

  const columns: ColumnDef<WalletRedeemRow, unknown>[] = [
    {
      accessorKey: "offerId",
      header: t("table.redeem"),
      cell: ({ row }) => (
        <span className="text-dusk">{row.getValue("offerId")}</span>
      ),
    },
    {
      accessorKey: "state",
      header: t("table.state"),
      cell: ({ row }) => (
        <span className="text-moss">{row.getValue("state")}</span>
      ),
    },
    {
      accessorKey: "responseWindowDays",
      header: t("table.window"),
      cell: ({ row }) =>
        `${row.getValue<number>("responseWindowDays")} ${t("table.days")}`,
    },
  ];

  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
