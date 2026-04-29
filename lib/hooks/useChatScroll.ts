"use client";

// Anchors each new question to the top of the scroll viewport once it
// commits to layout. The accompanying assistant turn carries a min-h that
// reserves the trailing viewport headroom needed for scrollIntoView to
// land at the top — see MessageBubble's isLastAssistant branch. The first
// question stays cradled in pt-12 because the comfort guard skips an
// in-place scroll.

import { useEffect, useRef } from "react";

export function useChatScroll(lastUserMsgId: string | null) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lastUserMsgId) return;
    const scrollNode = scrollRef.current;
    if (!scrollNode) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Two rAFs: first commits the new bubble + its sibling assistant
    // (which carries the min-h headroom) to layout, second runs after the
    // browser has reconciled scrollHeight so scrollIntoView can land cleanly.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const node = document.getElementById(`msg-${lastUserMsgId}`);
        if (!node) return;
        const containerRect = scrollNode.getBoundingClientRect();
        const nodeTopInViewport =
          node.getBoundingClientRect().top - containerRect.top;
        // First question still cradled by pt-12 — leave it where it is.
        if (nodeTopInViewport >= 0 && nodeTopInViewport <= 80) return;
        node.scrollIntoView({
          block: "start",
          behavior: prefersReduced ? "auto" : "smooth",
        });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [lastUserMsgId]);

  return { scrollRef };
}
