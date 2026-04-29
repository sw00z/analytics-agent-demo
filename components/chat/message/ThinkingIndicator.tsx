"use client";

// Three pulsing dots, staggered by 200ms, shown while the assistant turn
// is in flight. Wrapped in role="status" so screen readers announce
// "Thinking" rather than reading the dot characters.

export function ThinkingIndicator() {
  return (
    <div
      className="flex items-center gap-1 py-1"
      role="status"
      aria-label="Thinking"
    >
      <span className="size-[7px] rounded-full bg-accent-strong animate-pulse-dot [animation-delay:0ms]" />
      <span className="size-[7px] rounded-full bg-accent-strong animate-pulse-dot [animation-delay:200ms]" />
      <span className="size-[7px] rounded-full bg-accent-strong animate-pulse-dot [animation-delay:400ms]" />
    </div>
  );
}
