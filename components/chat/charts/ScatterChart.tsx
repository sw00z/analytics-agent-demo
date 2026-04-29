"use client";

// Scatter chart with density-driven dot sizing and opacity. At >200 points
// the dots shrink to 2px / 0.4 opacity to avoid pixel saturation; below
// that we render at 3px / 0.55.

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart as RcScatterChart,
  Scatter,
} from "recharts";
import type { ChartConfig } from "@/lib/api/agent";
import { numericAxisFit } from "@/lib/charts/axis";
import { chartHeight, coerceNumeric, formatValue } from "@/lib/charts/format";
import {
  TICK_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_STYLE,
} from "./shared/styles";

interface Props {
  data: Record<string, unknown>[];
  config: ChartConfig;
}

export function ScatterChart({ data, config }: Props) {
  const xKey = config.xAxis ?? "x";
  const yKey = config.yAxis ?? config.dataKey ?? "y";
  const numericData = coerceNumeric(data, [xKey, yKey]);
  const dense = numericData.length > 200;
  const xAxisFit = numericAxisFit(numericData, [xKey], formatValue);
  const yAxisFit = numericAxisFit(numericData, [yKey], formatValue);
  const dotR = dense ? 2 : 3;
  const dotOpacity = dense ? 0.4 : 0.55;

  return (
    <ResponsiveContainer
      width="100%"
      height={chartHeight(config.type, numericData.length)}
    >
      <RcScatterChart
        margin={{ top: 6, right: 16, left: 4, bottom: 6 }}
        role="img"
        aria-label={`Scatter chart: ${xKey} versus ${yKey}, ${numericData.length} data points`}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
        <XAxis
          type="number"
          dataKey={xKey}
          name={xKey}
          tick={TICK_STYLE}
          tickLine={false}
          axisLine={{ stroke: "var(--rule)" }}
          tickFormatter={(v) => formatValue(v, xKey)}
          minTickGap={xAxisFit.minTickGap}
        />
        <YAxis
          type="number"
          dataKey={yKey}
          name={yKey}
          tick={TICK_STYLE}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatValue(v, yKey)}
          minTickGap={yAxisFit.minTickGap}
          width={yAxisFit.width}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3", stroke: "var(--accent)" }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          formatter={(value, name) => [
            formatValue(value, String(name)),
            String(name),
          ]}
        />
        <Scatter
          data={numericData}
          fill="var(--chart-1)"
          shape="circle"
          r={dotR}
          fillOpacity={dotOpacity}
        />
      </RcScatterChart>
    </ResponsiveContainer>
  );
}
