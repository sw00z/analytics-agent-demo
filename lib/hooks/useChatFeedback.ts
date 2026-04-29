"use client";

// Thin wrapper over the submitFeedback mutation. Returns a handler the
// MessageBubble can call when a user clicks Helpful / Not helpful and
// submits the comment dialog.

import { useMutation } from "@tanstack/react-query";
import { submitFeedback } from "@/lib/api/agent";

export function useChatFeedback(
  userId: string,
  currentSessionId: number | null,
) {
  const mutation = useMutation({
    mutationFn: (input: {
      sessionId: number;
      messageId: number;
      rating: "positive" | "negative";
      comment: string;
    }) => submitFeedback(userId, input),
  });

  const handleFeedback = async (
    rating: "positive" | "negative",
    comment: string,
    messageId: number,
  ) => {
    if (!currentSessionId) return;
    await mutation.mutateAsync({
      sessionId: currentSessionId,
      messageId,
      rating,
      comment,
    });
  };

  return { handleFeedback };
}
