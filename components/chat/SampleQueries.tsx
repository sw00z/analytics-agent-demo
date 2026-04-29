"use client";

// Eight starter queries — one per chart type the agent can produce — so a
// reviewer can exercise every BIResponseSchema variant from the empty state.
// The italic emphasis on each row hints at the chart shape the question will
// produce, but the agent still infers the type from the query semantics; the
// tag column on the right is informational.

import { cn } from "@/lib/utils";

interface QueryRow {
  num: string;
  label: React.ReactNode;
  query: string;
  tag: string;
}

const QUERIES: QueryRow[] = [
  {
    num: "001",
    label: (
      <>
        Show monthly revenue <em>trends</em> across 2017.
      </>
    ),
    query: "Show me monthly revenue trends across 2017",
    tag: "Line",
  },
  {
    num: "002",
    label: (
      <>
        How did <em>cumulative orders</em> grow over the year?
      </>
    ),
    query: "How did cumulative orders grow over 2017?",
    tag: "Area",
  },
  {
    num: "003",
    label: (
      <>
        What are the top 10 product <em>categories</em> by revenue?
      </>
    ),
    query: "What are the top 10 product categories by revenue?",
    tag: "Bar",
  },
  {
    num: "004",
    label: (
      <>
        Which <em>sellers</em> shipped the most revenue, ranked?
      </>
    ),
    query: "Rank the top 15 sellers by total revenue shipped",
    tag: "Ranked",
  },
  {
    num: "005",
    label: (
      <>
        Payment-type <em>composition</em> by month.
      </>
    ),
    query: "Show payment type composition by month across 2017",
    tag: "Stacked",
  },
  {
    num: "006",
    label: (
      <>
        Break down <em>orders</em> by payment method.
      </>
    ),
    query: "Break down orders by payment method",
    tag: "Pie",
  },
  {
    num: "007",
    label: (
      <>
        Is there a relationship between <em>price</em> and <em>review score</em>?
      </>
    ),
    query: "Is there a relationship between product price and review score?",
    tag: "Scatter",
  },
  {
    num: "008",
    label: (
      <>
        List the top sellers by <em>average review score</em>, minimum fifty reviews.
      </>
    ),
    query:
      "List the top 20 sellers by average review score, minimum 50 reviews",
    tag: "Table",
  },
];

interface Props {
  onSelect: (q: string) => void;
  disabled?: boolean;
}

export function SampleQueries({ onSelect, disabled }: Props) {
  return (
    <ol className="border-t border-rule">
      {QUERIES.map((q) => (
        <li key={q.num}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect(q.query)}
            className={cn(
              "group/row grid w-full grid-cols-[50px_1fr_auto] items-baseline gap-3.5",
              "px-1 py-3.5 border-b border-rule text-left cursor-pointer",
              "transition-colors duration-150",
              "hover:bg-surface-2",
              "focus-visible:outline-none focus-visible:bg-surface-2",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <span className="font-mono text-[11px] tracking-[0.06em] text-ink-mute">
              {q.num}
            </span>
            <span className="font-serif text-[16px] text-ink leading-snug [&_em]:italic [&_em]:text-accent-strong">
              {q.label}
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.10em] text-ink-mute">
              {q.tag}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
