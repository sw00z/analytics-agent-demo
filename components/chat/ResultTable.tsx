"use client";

// Tabular renderer for the agent's chartConfig.type === "table" responses.
// Auto-generates headers from the first row's keys.

import { cn } from "@/lib/utils";

interface Props {
  data: Record<string, unknown>[];
}

function isNumericLike(value: unknown): boolean {
  if (typeof value === "number") return true;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) && /^-?\d/.test(value.trim());
  }
  return false;
}

function formatCell(value: unknown, key: string): string {
  if (value == null) return "—";
  const k = key.toLowerCase();
  if (typeof value === "number" || (typeof value === "string" && !isNaN(parseFloat(value)))) {
    const num = typeof value === "number" ? value : parseFloat(value);
    if (Number.isFinite(num)) {
      if (
        k.includes("revenue") ||
        k.includes("price") ||
        k.includes("value") ||
        k.includes("total") ||
        k.includes("freight")
      ) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 2,
        }).format(num);
      }
      if (Number.isInteger(num) && Math.abs(num) > 999) {
        return new Intl.NumberFormat("en-US").format(num);
      }
    }
  }
  if (typeof value === "string" && value.length > 40) {
    return value.slice(0, 37) + "…";
  }
  return String(value);
}

export function ResultTable({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="font-serif italic text-[14px] text-ink-mute">
        No rows returned.
      </div>
    );
  }

  const columns = Object.keys(data[0]);
  const numericColumns = new Set(
    columns.filter((col) => isNumericLike(data[0][col])),
  );

  return (
    <div className="border border-rule rounded">
      <div className="max-h-table overflow-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-surface-2">
            <tr className="border-b border-rule">
              {columns.map((col) => (
                <th
                  key={col}
                  className={cn(
                    "px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.10em] font-medium text-ink-mute",
                    numericColumns.has(col) ? "text-right" : "text-left",
                  )}
                >
                  {col.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-t border-rule/60 transition-colors",
                  "hover:bg-surface-2",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className={cn(
                      "px-3.5 py-2 whitespace-nowrap",
                      numericColumns.has(col)
                        ? "text-right font-mono tabular-nums text-ink"
                        : "text-left font-serif text-ink",
                    )}
                  >
                    {formatCell(row[col], col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length >= 100 && (
        <div className="px-3.5 py-2 font-serif italic text-[12px] text-ink-mute border-t border-rule bg-surface-2">
          Showing first {data.length} rows (capped by the agent&apos;s LIMIT
          guardrail).
        </div>
      )}
    </div>
  );
}
