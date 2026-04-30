"use client";

// Error turn — printer's-note style. Italic serif on a hairline-bordered
// block. The prose itself carries the diagnostic. Recovery is offered as
// an inline "Try again" link in the same italic register: the failure
// state stays as considered as the success state (PRODUCT.md §5).
//
// `errorKind` tunes the kicker. `aborted` is user-initiated (Stop), so it
// gets the softer "Stopped." kicker in ink-mute — not a destructive alert.
// `agent_error` and `rate_limit` get "Note." in destructive red. The body
// prose, hairline borders, and Try-again styling stay shared.
//
// The retry link only renders when a retry handler is wired by the parent.
// Rate limit (429) errors don't get a link here because the banner
// countdown above the composer is the affordance for that path.

interface Props {
  content: string;
  errorKind?: "rate_limit" | "agent_error" | "aborted";
  onRetry?: () => void;
}

export function ErrorBubble({ content, errorKind, onRetry }: Props) {
  const isAborted = errorKind === "aborted";
  const kickerLabel = isAborted ? "Stopped." : "Note.";
  const kickerColor = isAborted ? "text-ink-mute" : "text-destructive";

  return (
    <div className="animate-message-in-fast border-y border-rule py-3.5">
      <div
        className={`font-mono text-[11px] tracking-[0.14em] ${kickerColor} mb-1.5`}
      >
        {kickerLabel}
      </div>
      <p className="font-serif italic text-[15px] leading-[1.55] text-ink-2 max-w-[60ch] whitespace-pre-wrap">
        {content}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2.5 font-serif italic text-[14px] text-accent-strong border-b border-accent/40 hover:border-accent transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:border-accent"
        >
          Try again
        </button>
      )}
    </div>
  );
}
