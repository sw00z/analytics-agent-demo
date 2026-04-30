"use client";

// User turn — italic serif body with an accent left rule and a "Q." kicker.
// The id="msg-{id}" anchor is consumed by useChatScroll to anchor each new
// question to the top of the viewport.
//
// `onRetry` is wired by MessageList when this bubble is the latest message
// (Stop case, before any error pushes) or sits immediately above a trailing
// retryable error bubble (abort or agent failure). Renders a small inline
// "Retry" link aligned with the body baseline; calls the same retry()
// handler the trailing error bubble uses, so both surfaces share behavior.

interface Props {
  id: string;
  content: string;
  onRetry?: () => void;
}

export function UserBubble({ id, content, onRetry }: Props) {
  return (
    <div id={`msg-${id}`} className="animate-message-in-fast scroll-mt-3">
      <div className="border-l-2 border-accent pl-4 pr-3.5 py-[9px] max-w-[56ch] rounded-r-[4px] bg-[oklch(0.62_0.12_75_/_0.09)]">
        <div className="font-mono text-[11px] tracking-[0.14em] text-accent-strong mb-1">
          Q.
        </div>
        <p className="font-serif italic text-[18px] leading-[1.5] text-ink-2 whitespace-pre-wrap">
          {content}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 ml-4 font-serif italic text-[14px] text-accent-strong border-b border-accent/40 hover:border-accent transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:border-accent"
        >
          Retry
        </button>
      )}
    </div>
  );
}
