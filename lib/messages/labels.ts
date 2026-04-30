// Display-label helpers for assistant message figures. Pulled out of
// MessageBubble so the figure caption logic can be reused if other surfaces
// (e.g. session export) need to render the same chart-type vocabulary.

import type { ChartConfig } from "@/lib/api/agent";

export function humanLabelFor(type: ChartConfig["type"]): string {
  switch (type) {
    case "bar":
      return "Bar chart";
    case "horizontal_bar":
      return "Ranked bar";
    case "stacked_bar":
      return "Stacked bar";
    case "line":
      return "Line chart";
    case "area":
      return "Area chart";
    case "pie":
      return "Distribution";
    case "scatter":
      return "Scatter";
    case "table":
      return "Table";
  }
}

export function captionFor(
  type: ChartConfig["type"],
  rowCount: number,
): string {
  if (type === "table") return `Showing ${rowCount} rows.`;
  if (type === "pie") return `${rowCount} segments, sized by share.`;
  if (type === "scatter") return `${rowCount} observations.`;
  if (type === "stacked_bar") return `${rowCount} periods, stacked by series.`;
  return `${rowCount} ${rowCount === 1 ? "point" : "points"}.`;
}
