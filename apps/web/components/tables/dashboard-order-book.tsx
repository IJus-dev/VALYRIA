"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useLocale } from "@/lib/locale-context";

export interface DashboardOrderRow {
  id: string;
  series: string;
  quantity: number;
  unitPrice: number;
  status: string;
}

interface DashboardOrderBookProps {
  data: DashboardOrderRow[];
}

export function DashboardOrderBook({ data }: DashboardOrderBookProps) {
  const { t, locale } = useLocale();

  const columns: ColumnDef<DashboardOrderRow, unknown>[] = [
    {
      accessorKey: "series",
      header: t("table.series"),
      cell: ({ row }) => (
        <span className="font-medium text-dusk">{row.getValue("series")}</span>
      ),
    },
    {
      accessorKey: "quantity",
      header: t("table.qty"),
      cell: ({ row }) => (row.getValue<number>("quantity")).toLocaleString(locale),
    },
    {
      accessorKey: "unitPrice",
      header: t("table.price"),
      cell: ({ row }) =>
        `R$ ${(row.getValue<number>("unitPrice")).toFixed(2)}`,
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
