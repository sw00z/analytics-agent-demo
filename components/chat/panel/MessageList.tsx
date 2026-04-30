"use client";

// The message column. Maps over messages and renders a MessageBubble per
// turn. Tags the most recent assistant turn so its bubble can reserve
// trailing viewport headroom for the scroll-to-top anchor (see
// useChatScroll + MessageBubble's isLastAssistant branch).
//
// Retry routing is exclusive — exactly one surface per failure state, so
// the user never sees two retry links stacked on adjacent turns. The rule
// follows whose voice owns the failure:
//
//   trailing message kind          retry surface
//   ─────────────────────────────  ────────────────────────────────────
//   user bubble (transient)        the user bubble itself
//   error: aborted (user clicked Stop)  the user bubble above the note
//   error: agent_error (network/AI)     the error bubble itself
//   error: rate_limit               none — banner countdown is the affordance
//   assistant placeholder / answer  none
//
// User-initiated cancel anchors retry to the question. System failure
// anchors retry to the diagnostic prose ("…Try rephrasing." → Try again).

import { MessageBubble, type DisplayMessage } from "../MessageBubble";

interface Props {
  messages: DisplayMessage[];
  lastAssistantId: string | null;
  onFeedback?: (
    rating: "positive" | "negative",
    comment: string,
    messageId: number,
  ) => Promise<void>;
  onRetry?: (override?: string) => void;
}

function pickRetryTarget(messages: DisplayMessage[]): number {
  const lastIdx = messages.length - 1;
  if (lastIdx < 0) return -1;
  const last = messages[lastIdx];

  if (last.role === "user") return lastIdx;

  if (last.role === "error") {
    if (last.errorKind === "aborted") {
      for (let i = lastIdx - 1; i >= 0; i--) {
        if (messages[i].role === "user") return i;
      }
      return -1;
    }
    if (last.errorKind === "agent_error") return lastIdx;
  }

  return -1;
}

export function MessageList({
  messages,
  lastAssistantId,
  onFeedback,
  onRetry,
}: Props) {
  const retryTargetIdx = pickRetryTarget(messages);

  return (
    <div className="mx-auto w-full max-w-rail px-6 sm:px-14 pt-12 pb-8 flex flex-col gap-10">
      {messages.map((m, i) => (
        <MessageBubble
          key={m.id}
          message={m}
          onFeedback={onFeedback}
          isLastAssistant={m.id === lastAssistantId}
          onRetry={i === retryTargetIdx ? onRetry : undefined}
        />
      ))}
    </div>
  );
}
