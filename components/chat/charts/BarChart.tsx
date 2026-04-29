"use client";

// One component handles bar / horizontal_bar / stacked_bar. They all use the
// same Recharts <BarChart> with a layout flip and an optional stackId. The
// per-orientation differences (margin, axis types, tickFormatter, label
// truncation) are localized as small ternaries rather than separate files
// because every variant needs the same coerceNumeric / seriesKeys pipeline.

import {
  BarChart as RcBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ChartConfig } from "@/lib/api/agent";
import { chartHeight, coerceNumeric, formatValue } from "@/lib/charts/format";
import {
  CHART_COLORS,
  DIAGONAL_X_AXIS,
  TICK_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_STYLE,
} from "./shared/styles";

interface Props {
  data: Record<string, unknown>[];
  config: ChartConfig;
}

export function BarChart({ data, config }: Props) {
  const isHorizontal = config.type === "horizontal_bar";
  const isStacked = config.type === "stacked_bar";
  const seriesKeys =
    isStacked && config.series != null && config.series.length > 0
      ? config.series
      : [config.dataKey ?? "value"];
  const numericData = coerceNumeric(data, seriesKeys);
  const denseHorizontal = isHorizontal && numericData.length > 12;
  const margin = isHorizontal
    ? { top: 6, right: 16, left: 16, bottom: 6 }
    : { top: 6, right: 16, left: 4, bottom: 6 };

  const numericTickFormatter = (v: unknown) => formatValue(v, seriesKeys[0]);

  return (
    <ResponsiveContainer
      width="100%"
      height={chartHeight(config.type, numericData.length)}
    >
      <RcBarChart
        data={numericData}
        margin={margin}
        layout={isHorizontal ? "vertical" : "horizontal"}
        barCategoryGap={isStacked && seriesKeys.length > 4 ? 2 : 4}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--rule)"
          vertical={isHorizontal}
          horizontal={!isHorizontal}
        />
        <XAxis
          type={isHorizontal ? "number" : "category"}
          dataKey={isHorizontal ? undefined : config.xAxis}
          tick={TICK_STYLE}
          tickLine={false}
          axisLine={isHorizontal ? false : { stroke: "var(--rule)" }}
          tickFormatter={isHorizontal ? numericTickFormatter : undefined}
          angle={
            !isHorizontal && data.length > 6 ? DIAGONAL_X_AXIS.angle : 0
          }
          textAnchor={
            !isHorizontal && data.length > 6
              ? DIAGONAL_X_AXIS.textAnchor
              : "middle"
          }
          height={
            !isHorizontal && data.length > 6 ? DIAGONAL_X_AXIS.height : 30
          }
          interval={0}
        />
        <YAxis
          type={isHorizontal ? "category" : "number"}
          dataKey={isHorizontal ? config.xAxis : undefined}
          tick={TICK_STYLE}
          tickLine={false}
          axisLine={false}
          tickFormatter={
            isHorizontal
              ? (v: unknown) => {
                  // Truncate long category labels to 22ch with ellipsis at
                  // dense row counts so wide names don't push the chart
                  // body off-canvas.
                  const s = String(v);
                  if (denseHorizontal && s.length > 22) {
                    return s.slice(0, 21) + "…";
                  }
                  return s;
                }
              : numericTickFormatter
          }
          width={isHorizontal ? 140 : 64}
        />
        <Tooltip
          cursor={{ fill: "var(--accent-soft)" }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          formatter={(value, name) => [
            formatValue(value, String(name)),
            String(name),
          ]}
        />
        {isStacked && (
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
        )}
        {seriesKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            stackId={isStacked ? "stack" : undefined}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            radius={
              isStacked
                ? i === seriesKeys.length - 1
                  ? isHorizontal
                    ? [0, 3, 3, 0]
                    : [3, 3, 0, 0]
                  : 0
                : isHorizontal
                  ? [0, 3, 3, 0]
                  : [3, 3, 0, 0]
            }
          />
        ))}
      </RcBarChart>
    </ResponsiveContainer>
  );
}
