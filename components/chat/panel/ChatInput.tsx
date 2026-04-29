"use client";

// Bottom composer. Hosts the rate-limit notice, follow-up chip strip,
// textarea + Ask submit button, and the keyboard-hint footer. The textarea
// is the visual focal point — borderless, italic serif, growing up to
// 160px before scrolling internally. Submit on Enter; Shift+Enter for
// newline.

import { AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FollowUpChips } from "../FollowUpChips";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  retryAfter: number | null;
  followUps: string[];
  onSelectFollowUp: (q: string) => void;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isPending,
  retryAfter,
  followUps,
  onSelectFollowUp,
}: Props) {
  const canSend = value.trim().length > 0 && !isPending;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="shrink-0 border-t border-rule px-6 sm:px-14 pt-2 pb-3 bg-background">
      <div className="mx-auto w-full max-w-[60rem] flex flex-col gap-2">
        {retryAfter !== null && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="flex items-center gap-1.5 font-serif italic text-[13px] text-destructive self-start"
          >
            <AlertCircle className="size-3.5" />
            Too many requests. Try again in {retryAfter}s.
          </div>
        )}
        <FollowUpChips
          questions={followUps}
          onSelect={onSelectFollowUp}
          disabled={isPending}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className={cn(
            "flex items-center gap-3 border border-rule rounded-sm px-1 py-2.5",
            "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10 transition-colors",
          )}
        >
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ask anything about the dataset, in plain English"
            aria-label="Ask a question about the e-commerce data"
            disabled={isPending}
            rows={1}
            className={cn(
              "min-h-[28px] max-h-[160px] resize-none border-0 bg-transparent rounded-none",
              "px-0 py-0 font-serif italic text-[17px] leading-[1.5] text-ink",
              "shadow-none ring-0 focus-visible:ring-0 focus-visible:border-0",
              "placeholder:text-ink-mute placeholder:italic",
              "[&]:bg-transparent",
            )}
            autoFocus
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 cursor-pointer",
              "font-mono text-[11px] font-medium uppercase tracking-[0.14em]",
              "border border-accent bg-accent-soft text-accent-strong",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors duration-150",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            Ask
          </button>
        </form>
        <p className="font-mono text-[10px] uppercase tracking-[0.10em] text-ink-mute text-center">
          Enter to ask <span className="lowercase">·</span> Shift+Enter for newline <span className="lowercase">·</span> read-only via gpt-4o
        </p>
      </div>
    </div>
  );
}
