"use client";

// Error turn — printer's-note style. Italic serif on a hairline-bordered
// block. The prose itself carries the diagnostic.

interface Props {
  content: string;
}

export function ErrorBubble({ content }: Props) {
  return (
    <div className="animate-message-in-fast border-y border-rule py-3.5">
      <div className="font-mono text-[11px] tracking-[0.14em] text-destructive mb-1.5">
        Note.
      </div>
      <p className="font-serif italic text-[15px] leading-[1.55] text-ink-2 max-w-[60ch] whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}
