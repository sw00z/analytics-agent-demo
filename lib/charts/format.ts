// Chart value formatters and data shaping utilities. Shared across all
// per-type chart components in components/chat/charts/. Keeping these in
// lib/ (not co-located with charts) lets ResultTable and other consumers
// reuse the same currency/number heuristics without crossing component
// boundaries.

import type { ChartConfig } from "@/lib/api/agent";

export function isMonetaryKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k.includes("revenue") ||
    k.includes("price") ||
    k.includes("value") ||
    k.includes("total") ||
    k.includes("amount") ||
    k.includes("freight")
  );
}

export function formatValue(value: unknown, key: string): string {
  if (typeof value === "number" || typeof value === "string") {
    const num = typeof value === "number" ? value : parseFloat(String(value));
    if (!Number.isFinite(num)) return String(value);
    if (isMonetaryKey(key)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
      }).format(num);
    }
    if (
      key.toLowerCase().includes("rate") ||
      key.toLowerCase().includes("pct")
    ) {
      return `${num.toFixed(1)}%`;
    }
    return new Intl.NumberFormat("en-US").format(num);
  }
  return String(value);
}

export function coerceNumeric<T extends Record<string, unknown>>(
  rows: T[],
  keys: string[],
): T[] {
  return rows.map((row) => {
    const next = { ...row };
    for (const k of keys) {
      if (k in next) {
        const n = Number(next[k]);
        (next as Record<string, unknown>)[k] = Number.isFinite(n) ? n : 0;
      }
    }
    return next;
  });
}

// Density layer. Returns figure height per chart type + row count.
export function chartHeight(type: ChartConfig["type"], n: number): number {
  if (type === "horizontal_bar") return Math.max(240, n * 22 + 60);
  if (type === "scatter") return n > 200 ? 380 : n > 80 ? 320 : 280;
  if (type === "stacked_bar") return 280;
  if (type === "bar") return n > 12 ? 320 : 280;
  if (type === "pie") return 320;
  return 280;
}
