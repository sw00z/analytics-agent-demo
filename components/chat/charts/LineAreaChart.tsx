"use client";

// Line and Area variants share enough Recharts wiring (ComposedChart, axis
// styling, density-driven stroke/dot adaptations) that they live in one
// component switched by config.type. Area additionally renders a
// linearGradient defs block; that's the only meaningful divergence.

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";
import type { ChartConfig } from "@/lib/api/agent";
import { categoryXAxisFit, numericAxisFit } from "@/lib/charts/axis";
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

export function LineAreaChart({ data, config }: Props) {
  const valueKey = config.dataKey ?? "value";
  const numericData = coerceNumeric(data, [valueKey]);
  const isArea = config.type === "area";
  const dense = numericData.length > 24;
  const xAxisFit = categoryXAxisFit(numericData, config.xAxis);
  const yAxisFit = numericAxisFit(numericData, [valueKey], formatValue);
  const strokeWidth = dense ? 1.5 : 2.25;
  const fillOpacity = dense ? 0.12 : 0.2;

  return (
    <ResponsiveContainer
      width="100%"
      height={chartHeight(config.type, numericData.length)}
    >
      <ComposedChart
        data={numericData}
        margin={{ top: 6, right: 16, left: 4, bottom: 6 }}
        role="img"
        aria-label={`${isArea ? "Area" : "Line"} chart: ${config.xAxis} by ${valueKey}, ${numericData.length} data points`}
      >
        {isArea && (
          <defs>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--chart-1)"
                stopOpacity={fillOpacity}
              />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--rule)"
          vertical={false}
        />
        <XAxis
          dataKey={config.xAxis}
          tick={TICK_STYLE}
          tickLine={false}
          axisLine={{ stroke: "var(--rule)" }}
          tickFormatter={xAxisFit.tickFormatter}
          interval={
            dense
              ? Math.max(1, Number(xAxisFit.interval) || 1)
              : xAxisFit.interval
          }
          minTickGap={xAxisFit.minTickGap}
          angle={xAxisFit.angle}
          textAnchor={xAxisFit.textAnchor}
          height={xAxisFit.height}
        />
        <YAxis
          tick={TICK_STYLE}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatValue(v, valueKey)}
          minTickGap={yAxisFit.minTickGap}
          width={yAxisFit.width}
        />
        <Tooltip
          cursor={{
            stroke: "var(--accent)",
            strokeWidth: 1,
            strokeDasharray: "3 3",
          }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          formatter={(value, name) => [
            formatValue(value, String(name)),
            String(name),
          ]}
        />
        {isArea ? (
          <Area
            type="monotone"
            dataKey={valueKey}
            stroke="var(--chart-1)"
            strokeWidth={strokeWidth}
            fill="url(#area-gradient)"
            activeDot={{
              r: 5,
              fill: "var(--chart-1)",
              strokeWidth: 2,
              stroke: "var(--background)",
            }}
          />
        ) : (
          <Line
            type="monotone"
            dataKey={valueKey}
            stroke="var(--chart-1)"
            strokeWidth={strokeWidth}
            dot={
              dense ? false : { r: 3, fill: "var(--chart-1)", strokeWidth: 0 }
            }
            activeDot={{
              r: 5,
              fill: "var(--chart-1)",
              strokeWidth: 2,
              stroke: "var(--background)",
            }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
