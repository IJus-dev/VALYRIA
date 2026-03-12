"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTheme } from "@/design-tokens";

interface PriceTrendProps {
  data: Array<{
    label: string;
    value: number;
  }>;
}

export function PriceTrend({ data }: PriceTrendProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 8" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke={chartTheme.axis} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} stroke={chartTheme.axis} />
        <Tooltip
          contentStyle={{
            borderRadius: chartTheme.tooltipRadius,
            border: chartTheme.tooltipBorder,
            backgroundColor: chartTheme.tooltipBackground
          }}
          formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Unit price"]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={chartTheme.line}
          strokeWidth={3}
          dot={{ fill: chartTheme.dot, strokeWidth: 0, r: 4 }}
          activeDot={{ r: 5, fill: chartTheme.activeDot }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
