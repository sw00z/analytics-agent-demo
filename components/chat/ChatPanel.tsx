"use client";

// The orchestrator. Owns:
//   - the local message list (optimistic UI for the user message + streaming-ish
//     placeholder for the assistant turn, replaced when the response lands)
//   - the current sessionId
//   - the user input
//   - hydration from /api/agent/sessions/:id when a session is selected
//
// Writes flow through TanStack Query mutations (sendQuery, submitFeedback)
// inside the dedicated hooks below; cache invalidation handles dropdown
// updates.

import { useState } from "react";
import { useSessionMessages } from "@/lib/hooks/useSessionMessages";
import { useChatScroll } from "@/lib/hooks/useChatScroll";
import { useChatStreaming } from "@/lib/hooks/useChatStreaming";
import { useChatFeedback } from "@/lib/hooks/useChatFeedback";
import { ChatEmptyState } from "./panel/EmptyState";
import { MessageList } from "./panel/MessageList";
import { ChatInput } from "./panel/ChatInput";
import { ScrollbarThumb } from "./panel/ScrollbarThumb";

interface Props {
  userId: string;
  currentSessionId: number | null;
  onSessionChange: (id: number) => void;
}

export function ChatPanel({ userId, currentSessionId, onSessionChange }: Props) {
  const { messages, setMessages } = useSessionMessages(userId, currentSessionId);
  const [input, setInput] = useState("");
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  // Anchor each new question to the top of the scroll viewport. The
  // accompanying assistant turn carries a min-h that reserves the trailing
  // viewport headroom needed for scrollIntoView to actually land at the top
  // (see MessageBubble's isLastAssistant branch).
  const lastUserMsgId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i].id;
    }
    return null;
  })();
  const lastAssistantId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i].id;
    }
    return null;
  })();

  const { scrollRef } = useChatScroll(lastUserMsgId);

  const { send, isPending } = useChatStreaming({
    userId,
    currentSessionId,
    setMessages,
    setRetryAfter,
    onSessionChange,
  });
  const { handleFeedback } = useChatFeedback(userId, currentSessionId);

  const submit = () => {
    send(input);
    setInput("");
  };

  // Source the chip strip from the latest non-placeholder assistant turn.
  const latestFollowUps = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (
        m.role === "assistant" &&
        m.content !== "…" &&
        m.followUp &&
        m.followUp.length > 0
      ) {
        return m.followUp;
      }
    }
    return [];
  })();

  const showSampleQueries = messages.length === 0;

  return (
    <div className="relative h-full min-h-0 flex flex-col">
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-none"
        >
          {showSampleQueries ? (
            <div className="mx-auto w-full max-w-rail px-6 sm:px-14 pt-14 pb-10">
              <ChatEmptyState onSelect={send} disabled={isPending} />
            </div>
          ) : (
            <MessageList
              messages={messages}
              lastAssistantId={lastAssistantId}
              onFeedback={currentSessionId ? handleFeedback : undefined}
            />
          )}
        </div>
        <ScrollbarThumb scrollRef={scrollRef} />
      </div>

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={submit}
        isPending={isPending}
        retryAfter={retryAfter}
        followUps={latestFollowUps}
        onSelectFollowUp={send}
      />
    </div>
  );
}
