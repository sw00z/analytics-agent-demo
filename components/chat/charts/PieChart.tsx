"use client";

// Pie chart with "Other" aggregation past the 6th slice so mid-cardinality
// data doesn't render a 12-slice rainbow. Slice colors are baked into each
// row via a `fill` field rather than passed via Cell elements — Recharts
// reads it off the row when present.

import {
  Tooltip,
  ResponsiveContainer,
  PieChart as RcPieChart,
  Pie,
  Legend,
} from "recharts";
import type { ChartConfig } from "@/lib/api/agent";
import { chartHeight, coerceNumeric, formatValue } from "@/lib/charts/format";
import {
  CHART_COLORS,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_STYLE,
} from "./shared/styles";
import { renderPieLabel } from "./shared/PieLabel";

interface Props {
  data: Record<string, unknown>[];
  config: ChartConfig;
}

export function PieChart({ data, config }: Props) {
  const valueKey = config.dataKey ?? "value";
  const nameKey = config.xAxis ?? "name";

  const numericRaw = coerceNumeric(data, [valueKey])
    .filter((row) => Number(row[valueKey]) > 0)
    .sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]));

  const TOP = 5;
  let numericData: Record<string, unknown>[];
  if (numericRaw.length > TOP + 1) {
    const head = numericRaw.slice(0, TOP);
    const tail = numericRaw.slice(TOP);
    const otherSum = tail.reduce(
      (acc, row) => acc + Number(row[valueKey] ?? 0),
      0,
    );
    numericData = [
      ...head.map<Record<string, unknown>>((row, i) => ({
        ...row,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
      {
        [nameKey]: "Other",
        [valueKey]: otherSum,
        fill: "var(--ink-mute)",
      },
    ];
  } else {
    numericData = numericRaw.map<Record<string, unknown>>((row, i) => ({
      ...row,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }

  return (
    <ResponsiveContainer
      width="100%"
      height={chartHeight(config.type, numericData.length)}
    >
      <RcPieChart
        role="img"
        aria-label={`Pie chart: ${nameKey} breakdown, ${numericData.length} categories`}
      >
        <Pie
          data={numericData}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={56}
          paddingAngle={2}
          stroke="var(--background)"
          strokeWidth={2}
          label={renderPieLabel}
          labelLine={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          formatter={(value, name) => [
            formatValue(value, String(name)),
            String(name),
          ]}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{
            fontSize: 11,
            color: "var(--ink-mute)",
            fontFamily: "var(--font-plex-mono), monospace",
            letterSpacing: "0.06em",
            paddingTop: 8,
          }}
        />
      </RcPieChart>
    </ResponsiveContainer>
  );
}
