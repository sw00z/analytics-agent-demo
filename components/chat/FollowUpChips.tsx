"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  questions: string[];
  onSelect: (q: string) => void;
  disabled?: boolean;
}

// Editorial-paper follow-ups. Single horizontal line with hairline-underlined
// italic links. Edge fades only appear on the side that has overflowing
// content (left fade vanishes at scrollLeft=0, right fade vanishes when
// scrolled to the end), so the strip never looks faded when there's nothing
// hidden in that direction.
export function FollowUpChips({ questions, onSelect, disabled }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = node;
      setFadeLeft(scrollLeft > 1);
      setFadeRight(scrollLeft + clientWidth < scrollWidth - 1);
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => {
      node.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [questions]);

  if (!questions || questions.length === 0) return null;

  // Hand-rolled mask so each side fades independently. The mask gradient
  // is composed in CSS variables so the fade widths can be reused.
  const maskImage = (() => {
    const left = fadeLeft ? "transparent" : "#000";
    const right = fadeRight ? "transparent" : "#000";
    return `linear-gradient(to right, ${left}, #000 18px, #000 calc(100% - 18px), ${right})`;
  })();

  return (
    <div className="flex items-baseline gap-x-3">
      <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-mute">
        Try
      </span>
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 min-w-0",
          "flex items-baseline gap-x-3 flex-nowrap whitespace-nowrap",
          "overflow-x-auto scrollbar-none",
          "-mx-1 px-1",
        )}
        style={{
          WebkitMaskImage: maskImage,
          maskImage,
        }}
      >
        {questions.map((q, i) => (
          <span key={`${i}-${q}`} className="inline-flex shrink-0 items-baseline gap-x-3">
            {i > 0 && (
              <span aria-hidden className="text-ink-mute">
                ·
              </span>
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(q)}
              style={{ animationDelay: `${i * 50}ms` }}
              className={cn(
                "animate-chip-in cursor-pointer shrink-0",
                "font-serif italic text-[14px] text-ink-2 border-b border-rule pb-px",
                "hover:text-accent-strong hover:border-accent",
                "focus-visible:outline-none focus-visible:text-accent-strong focus-visible:border-accent",
                "disabled:pointer-events-none disabled:opacity-50",
                "transition-colors duration-150",
              )}
            >
              {q}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
