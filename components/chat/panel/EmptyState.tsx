"use client";

// Editorial-style cold-start. Volume kicker, oversized serif headline,
// italic subhead explaining the dataset and the agent's read-only contract,
// then the SampleQueries grid. Rendered when the message list is empty.

import { SampleQueries } from "../SampleQueries";

interface Props {
  onSelect: (q: string) => void;
  disabled?: boolean;
}

export function ChatEmptyState({ onSelect, disabled }: Props) {
  return (
    <div className="flex flex-col">
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-mute mb-3.5">
        ----------------------------------------------------------
      </div>
      <h2 className="font-serif text-[38px] sm:text-[42px] font-medium leading-[1.1] tracking-[-0.01em] text-ink max-w-[18ch]">
        Hi, what would you like to know?
      </h2>
      <p className="font-serif italic text-[17px] leading-[1.52] text-ink-2 mt-3.5 max-w-[56ch]">
        Ask about ~99K Brazilian e-commerce orders from 2016 to 2018. The agent
        writes a SQL query (read-only), runs it, and answers in prose with the
        appropriate chart. Pick a starting question below, or type your own.
      </p>
      <div className="mt-9">
        <SampleQueries onSelect={onSelect} disabled={disabled} />
      </div>
    </div>
  );
}
