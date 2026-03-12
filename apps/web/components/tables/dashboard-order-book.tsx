"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

export interface DashboardOrderRow {
  id: string;
  series: string;
  quantity: number;
  unitPrice: number;
  status: string;
}

const columns: ColumnDef<DashboardOrderRow, unknown>[] = [
  {
    accessorKey: "series",
    header: "Série",
    cell: ({ row }) => (
      <span className="font-medium text-dusk">{row.getValue("series")}</span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Qtd",
    cell: ({ row }) => (row.getValue<number>("quantity")).toLocaleString("pt-BR"),
  },
  {
    accessorKey: "unitPrice",
    header: "Preço",
    cell: ({ row }) =>
      `R$ ${(row.getValue<number>("unitPrice")).toFixed(2)}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="text-moss">{row.getValue("status")}</span>
    ),
  },
];

interface DashboardOrderBookProps {
  data: DashboardOrderRow[];
}

export function DashboardOrderBook({ data }: DashboardOrderBookProps) {
  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
