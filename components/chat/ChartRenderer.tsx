"use client";

// Renders the agent's chart payload using Recharts. The agent emits
// chartConfig.{type, xAxis, yAxis, dataKey, series?}; we map that to the
// matching component via REGISTRY. For 'table', we delegate to ResultTable.
//
// Per-type density / formatting / styling lives in:
//   components/chat/charts/{LineAreaChart,BarChart,ScatterChart,PieChart}.tsx
//   components/chat/charts/shared/{styles.ts,PieLabel.tsx}
//   lib/charts/format.ts                 (formatValue, coerceNumeric, chartHeight)

import type { ComponentType } from "react";
import type { ChartConfig } from "@/lib/api/agent";
import { ResultTable } from "./ResultTable";
import { LineAreaChart } from "./charts/LineAreaChart";
import { BarChart } from "./charts/BarChart";
import { ScatterChart } from "./charts/ScatterChart";
import { PieChart } from "./charts/PieChart";
import { EmptyState } from "./charts/EmptyState";

interface ChartProps {
  data: Record<string, unknown>[];
  config: ChartConfig;
}

function TableAdapter({ data }: ChartProps) {
  return <ResultTable data={data} />;
}

const REGISTRY: Record<ChartConfig["type"], ComponentType<ChartProps>> = {
  line: LineAreaChart,
  area: LineAreaChart,
  bar: BarChart,
  horizontal_bar: BarChart,
  stacked_bar: BarChart,
  scatter: ScatterChart,
  pie: PieChart,
  table: TableAdapter,
};

interface Props {
  data: Record<string, unknown>[];
  config: ChartConfig;
}

export function ChartRenderer({ data, config }: Props) {
  if (!data || data.length === 0) return <EmptyState />;
  const Chart = REGISTRY[config.type];
  return Chart ? <Chart data={data} config={config} /> : null;
}
