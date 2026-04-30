"use client";

// Dispatcher for a single chat turn. Routes to UserBubble / ErrorBubble
// for those roles; otherwise renders the assistant turn with its
// "Answer." kicker, prose body, optional figure, optional SQL block, and
// the action row + feedback dialog.
//
// Per-variant rendering lives in components/chat/message/.
// Helper labels live in lib/messages/labels.ts.

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ChartConfig } from "@/lib/api/agent";
import { FeedbackDialog } from "./FeedbackDialog";
import { UserBubble } from "./message/UserBubble";
import { ErrorBubble } from "./message/ErrorBubble";
import { ThinkingIndicator } from "./message/ThinkingIndicator";
import { AssistantFigure } from "./message/AssistantFigure";
import { AssistantMarkdown } from "./message/AssistantMarkdown";
import { SqlBlock } from "./message/SqlBlock";
import { MessageActions } from "./message/MessageActions";

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  data?: Record<string, unknown>[];
  chartConfig?: ChartConfig;
  followUp?: string[];
  messageId?: number;
  /** SQL the agent generated. Rendered as a collapsible block beneath the
   *  prose answer when present on assistant turns. */
  sql?: string;
  /** Discriminator on error turns: `rate_limit` is its own affordance (the
   *  banner countdown above the composer), so no Try-again link is rendered;
   *  `agent_error` covers network and agent failures; `aborted` is the soft
   *  "Stopped." bubble pushed when the user clicks Stop. The latter two
   *  carry the retry link when this message is the latest in the list. */
  errorKind?: "rate_limit" | "agent_error" | "aborted";
}

interface Props {
  message: DisplayMessage;
  onFeedback?: (
    rating: "positive" | "negative",
    comment: string,
    messageId: number,
  ) => Promise<void>;
  /** True for the last assistant turn in the list. Reserves enough trailing
   *  height so the corresponding user question can anchor to the top of the
   *  viewport without leaving a static viewport-sized gap below the answer. */
  isLastAssistant?: boolean;
  /** Wired by MessageList to exactly one message per failure state:
   *  - `aborted` error → the user bubble above (user owns the cancel)
   *  - `agent_error` error → the error bubble itself (system owns the failure)
   *  - rate_limit / success / placeholder → no retry surface
   *  With an `override` arg, resubmits that text directly (used by the
   *  user-bubble path so the retry reflects the clicked bubble); without,
   *  falls back to the hook's lastQueryRef. */
  onRetry?: (override?: string) => void;
}

export function MessageBubble({
  message,
  onFeedback,
  isLastAssistant,
  onRetry,
}: Props) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pendingRating, setPendingRating] = useState<
    "positive" | "negative" | null
  >(null);
  const [submittedRating, setSubmittedRating] = useState<
    "positive" | "negative" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  if (message.role === "user") {
    return (
      <UserBubble
        id={message.id}
        content={message.content}
        onRetry={onRetry ? () => onRetry(message.content) : undefined}
      />
    );
  }

  if (message.role === "error") {
    const renderRetryHere = message.errorKind === "agent_error";
    return (
      <ErrorBubble
        content={message.content}
        errorKind={message.errorKind}
        onRetry={renderRetryHere && onRetry ? () => onRetry() : undefined}
      />
    );
  }

  // Assistant turn — no card, no border, no background. Just an "Answer."
  // kicker, body prose at 17px serif, optional figure, optional SQL.
  const isPlaceholder = message.content === "…";

  const openFeedback = (rating: "positive" | "negative") => {
    setPendingRating(rating);
    setFeedbackOpen(true);
  };

  const handleSubmit = async (comment: string) => {
    if (!pendingRating || !message.messageId || !onFeedback) return;
    setSubmitting(true);
    try {
      await onFeedback(pendingRating, comment, message.messageId);
      setSubmittedRating(pendingRating);
    } finally {
      setSubmitting(false);
      setFeedbackOpen(false);
      setPendingRating(null);
    }
  };

  // Reserve trailing viewport headroom on the latest assistant turn (including
  // the thinking-dots placeholder) so the corresponding user question can
  // anchor to the top via scrollIntoView. The reserved space shrinks naturally
  // once the answer fills the column.
  return (
    <div
      className={cn(
        "group/msg animate-message-in",
        isLastAssistant && "min-h-[calc(100svh-200px)]",
      )}
      aria-busy={isPlaceholder || undefined}
    >
      <div className="font-mono text-[11px] tracking-[0.14em] text-ink-mute mb-1.5">
        {isPlaceholder ? "Working." : "Answer."}
      </div>

      {isPlaceholder ? (
        <ThinkingIndicator />
      ) : (
        <AssistantMarkdown content={message.content} />
      )}

      {message.chartConfig && message.data && message.data.length > 0 && (
        <AssistantFigure data={message.data} config={message.chartConfig} />
      )}

      {!isPlaceholder && message.sql && <SqlBlock sql={message.sql} />}

      {!isPlaceholder && (
        <MessageActions
          messageContent={message.content}
          sql={message.sql}
          onFeedback={onFeedback && message.messageId ? onFeedback : undefined}
          messageId={message.messageId}
          submittedRating={submittedRating}
          submitting={submitting}
          openFeedback={openFeedback}
        />
      )}

      <FeedbackDialog
        open={feedbackOpen}
        rating={pendingRating}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
