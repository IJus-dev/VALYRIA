"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

export interface ReputationRow {
  userId: string;
  name: string;
  state: string;
  score: number;
  acceptedCredentials: number;
  activeBonds: number;
  disputesAgainst: number;
}

const columns: ColumnDef<ReputationRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Participante",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-dusk">{row.original.name}</div>
        <div className="text-ink/72">{row.original.state}</div>
      </div>
    ),
  },
  {
    accessorKey: "score",
    header: "Score",
    cell: ({ row }) => (
      <span className="font-semibold text-moss">
        {row.getValue<number>("score")}/100
      </span>
    ),
  },
  {
    accessorKey: "acceptedCredentials",
    header: "Credenciais",
  },
  {
    accessorKey: "activeBonds",
    header: "Bond",
  },
  {
    accessorKey: "disputesAgainst",
    header: "Disputas",
  },
];

interface ReputationTableProps {
  data: ReputationRow[];
}

export function ReputationTable({ data }: ReputationTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
