"use client";

// The message column. Maps over messages and renders a MessageBubble per
// turn. Tags the most recent assistant turn so its bubble can reserve
// trailing viewport headroom for the scroll-to-top anchor (see
// useChatScroll + MessageBubble's isLastAssistant branch).

import { MessageBubble, type DisplayMessage } from "../MessageBubble";

interface Props {
  messages: DisplayMessage[];
  lastAssistantId: string | null;
  onFeedback?: (
    rating: "positive" | "negative",
    comment: string,
    messageId: number,
  ) => Promise<void>;
}

export function MessageList({ messages, lastAssistantId, onFeedback }: Props) {
  return (
    <div className="mx-auto w-full max-w-rail px-6 sm:px-14 pt-12 pb-8 flex flex-col gap-10">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          onFeedback={onFeedback}
          isLastAssistant={m.id === lastAssistantId}
        />
      ))}
    </div>
  );
}
