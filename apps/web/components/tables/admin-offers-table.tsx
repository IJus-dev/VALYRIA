"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

export interface AdminOfferRow {
  id: string;
  seriesAlias: string;
  status: string;
  producerName: string;
  executionLane: string;
  proofCount: number;
  redeemCount: number;
  latestEvent: string;
}

const columns: ColumnDef<AdminOfferRow, unknown>[] = [
  {
    accessorKey: "seriesAlias",
    header: "Série",
    cell: ({ row }) => (
      <div>
        <Link
          href={`/offers/${row.original.id}`}
          className="text-sm font-medium text-dusk"
        >
          {row.original.seriesAlias}
        </Link>
        <div className="text-sm text-moss">{row.original.status}</div>
      </div>
    ),
  },
  {
    accessorKey: "producerName",
    header: "Produtor",
  },
  {
    accessorKey: "executionLane",
    header: "Lane",
    cell: ({ row }) =>
      row.getValue("executionLane") === "xrpl_dex" ? "XRPL DEX" : "local",
  },
  {
    accessorKey: "proofCount",
    header: "Proofs",
  },
  {
    accessorKey: "redeemCount",
    header: "Redeems",
  },
  {
    accessorKey: "latestEvent",
    header: "Último evento",
  },
];

interface AdminOffersTableProps {
  data: AdminOfferRow[];
}

export function AdminOffersTable({ data }: AdminOffersTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <DataTable columns={columns} data={data} />
    </Card>
  );
}
