// Recharts axis fitting helpers. These keep long category labels from
// pushing chart content outside the visible SVG area while preserving full
// values in the underlying data and tooltip payloads.

export type RechartsAxisInterval = number | "preserveStartEnd";

export interface CategoryXAxisFit {
  tickFormatter: (value: unknown) => string;
  interval: RechartsAxisInterval;
  minTickGap: number;
  angle: number;
  textAnchor: "middle" | "end";
  height: number;
}

export interface CategoryYAxisFit {
  tickFormatter: (value: unknown) => string;
  interval: RechartsAxisInterval;
  minTickGap: number;
  width: number;
}

export interface NumericAxisFit {
  width: number;
  minTickGap: number;
}

export interface AxisLabelPressure {
  count: number;
  longestLabel: number;
  risksOverflow: boolean;
}

const AVG_TICK_CHAR_WIDTH = 6;
const ELLIPSIS = "...";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function truncateAxisLabel(value: unknown, maxChars: number): string {
  const label = String(value ?? "");
  if (label.length <= maxChars) return label;
  if (maxChars <= ELLIPSIS.length) return label.slice(0, maxChars);
  return `${label.slice(0, maxChars - ELLIPSIS.length)}${ELLIPSIS}`;
}

export function categoryLabels(
  rows: Record<string, unknown>[],
  dataKey?: string,
): string[] {
  if (!dataKey) return [];
  return rows.map((row) => String(row[dataKey] ?? ""));
}

function longestLabelLength(labels: string[]): number {
  return labels.reduce((max, label) => Math.max(max, label.length), 0);
}

export function axisLabelPressure(
  rows: Record<string, unknown>[],
  dataKey?: string,
): AxisLabelPressure {
  const labels = categoryLabels(rows, dataKey);
  const count = labels.length;
  const longestLabel = longestLabelLength(labels);

  return {
    count,
    longestLabel,
    risksOverflow: count > 10 || longestLabel > 18,
  };
}

function categoryInterval(
  count: number,
  longestLabel: number,
): RechartsAxisInterval {
  if (count > 60) return 5;
  if (count > 40) return 4;
  if (count > 28) return 3;
  if (count > 18) return 2;
  if (count > 10 || longestLabel > 18) return "preserveStartEnd";
  return 0;
}

export function categoryXAxisFit(
  rows: Record<string, unknown>[],
  dataKey?: string,
): CategoryXAxisFit {
  const { count, longestLabel: longest } = axisLabelPressure(rows, dataKey);
  const diagonal = count > 6 || longest > 12;
  const highPressure = count > 18 || longest > 24;
  const maxChars =
    count > 30 ? 8 : count > 18 ? 10 : longest > 24 ? 14 : diagonal ? 16 : 22;

  return {
    tickFormatter: (value) => truncateAxisLabel(value, maxChars),
    interval: categoryInterval(count, longest),
    minTickGap: highPressure ? 14 : diagonal ? 10 : 6,
    angle: diagonal ? -38 : 0,
    textAnchor: diagonal ? "end" : "middle",
    height: diagonal ? (highPressure ? 96 : 80) : 34,
  };
}

export function categoryYAxisFit(
  rows: Record<string, unknown>[],
  dataKey?: string,
): CategoryYAxisFit {
  const { count, longestLabel: longest } = axisLabelPressure(rows, dataKey);
  const maxChars = count > 16 ? 18 : longest > 30 ? 22 : 26;

  return {
    tickFormatter: (value) => truncateAxisLabel(value, maxChars),
    interval: count > 60 ? 2 : count > 32 ? 1 : 0,
    minTickGap: count > 32 ? 6 : 4,
    width: clamp(maxChars * AVG_TICK_CHAR_WIDTH + 18, 96, 180),
  };
}

export function numericAxisFit(
  rows: Record<string, unknown>[],
  dataKeys: string[],
  formatter: (value: unknown, key: string) => string,
): NumericAxisFit {
  const longest = rows.reduce((max, row) => {
    const rowMax = dataKeys.reduce((innerMax, key) => {
      const next = key in row ? formatter(row[key], key).length : 0;
      return Math.max(innerMax, next);
    }, 0);
    return Math.max(max, rowMax);
  }, 0);

  return {
    width: clamp(longest * AVG_TICK_CHAR_WIDTH + 18, 56, 96),
    minTickGap: longest > 12 ? 12 : 8,
  };
}
