"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useLocale } from "@/lib/locale-context";

export interface ReputationRow {
  userId: string;
  name: string;
  state: string;
  score: number;
  acceptedCredentials: number;
  activeBonds: number;
  disputesAgainst: number;
}

interface ReputationTableProps {
  data: ReputationRow[];
}

export function ReputationTable({ data }: ReputationTableProps) {
  const { t, locale } = useLocale();

  const columns: ColumnDef<ReputationRow, unknown>[] = [
    {
      accessorKey: "name",
      header: t("table.participant"),
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-dusk">{row.original.name}</div>
          <div className="text-ink/72">{row.original.state}</div>
        </div>
      ),
    },
    {
      accessorKey: "score",
      header: t("table.score"),
      cell: ({ row }) => (
        <span className="font-semibold text-moss">
          {row.getValue<number>("score")}/100
        </span>
      ),
    },
    {
      accessorKey: "acceptedCredentials",
      header: t("table.credentials"),
    },
    {
      accessorKey: "activeBonds",
      header: t("table.bond"),
    },
    {
      accessorKey: "disputesAgainst",
      header: t("table.disputes"),
    },
  ];

  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
