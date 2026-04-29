"use client";

// Collapsible SQL disclosure — figure-style block with hairline rule above,
// mono uppercase summary acting as the trigger, mono pre body on cream-2.
// Auto-expanded for short queries (<=3 lines) so they read inline; longer
// queries default closed to keep the answer prose visually dominant.

import { cn } from "@/lib/utils";

const SQL_AUTO_EXPAND_LINES = 3;

interface Props {
  sql: string;
}

export function SqlBlock({ sql }: Props) {
  const trimmed = sql.trim();
  const lineCount = trimmed.split("\n").length;
  const expandedByDefault = lineCount <= SQL_AUTO_EXPAND_LINES;

  return (
    <details
      className="group/sql mt-4 border-t border-rule pt-3.5"
      open={expandedByDefault}
    >
      <summary
        className={cn(
          "flex items-center gap-2 cursor-pointer select-none mb-2",
          "font-mono text-[11px] tracking-[0.14em] uppercase text-accent-strong",
          "[&::-webkit-details-marker]:hidden",
          "hover:text-accent transition-colors",
        )}
      >
        <span className="flex-1">
          The query, in {lineCount} {lineCount === 1 ? "line" : "lines"}
        </span>
        <span
          aria-hidden
          className="font-serif normal-case tracking-normal italic text-ink-mute"
        >
          {/* details native open-state arrow swap */}
          <span className="group-open/sql:hidden">show</span>
          <span className="hidden group-open/sql:inline">hide</span>
        </span>
      </summary>
      <pre
        className={cn(
          "m-0 px-3.5 py-3 rounded overflow-x-auto",
          "font-mono text-[12.5px] leading-[1.65] text-ink",
          "bg-surface-2 border border-rule",
        )}
      >
        {trimmed}
      </pre>
    </details>
  );
}
