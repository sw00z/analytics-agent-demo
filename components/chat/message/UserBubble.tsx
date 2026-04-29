"use client";

// User turn — italic serif body with an accent left rule and a "Q." kicker.
// The id="msg-{id}" anchor is consumed by useChatScroll to anchor each new
// question to the top of the viewport.

interface Props {
  id: string;
  content: string;
}

export function UserBubble({ id, content }: Props) {
  return (
    <div id={`msg-${id}`} className="animate-message-in-fast scroll-mt-3">
      <div className="border-l-2 border-accent pl-[18px] py-1.5 max-w-[56ch]">
        <div className="font-mono text-[11px] tracking-[0.14em] text-accent-strong mb-1">
          Q.
        </div>
        <p className="font-serif italic text-[18px] leading-[1.5] text-ink-2 whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}
