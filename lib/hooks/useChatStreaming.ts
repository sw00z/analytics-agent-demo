"use client";

// Wraps the sendQuery mutation. Pushes optimistic user message + "…"
// placeholder, swaps the placeholder with the assistant turn on success,
// or replaces it with an error bubble on failure. On 429 with retryAfter,
// surfaces the seconds via the rate-limit hook's setter.
//
// Returns send() for the input form to call, plus the mutation pending
// flag so the input can disable while in flight.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendQuery, type AgentResponse } from "@/lib/api/agent";
import type { DisplayMessage } from "@/components/chat/MessageBubble";

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface Args {
  userId: string;
  currentSessionId: number | null;
  setMessages: React.Dispatch<React.SetStateAction<DisplayMessage[]>>;
  setRetryAfter: (n: number | null) => void;
  onSessionChange: (id: number) => void;
}

export function useChatStreaming({
  userId,
  currentSessionId,
  setMessages,
  setRetryAfter,
  onSessionChange,
}: Args) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      message,
      sessionId,
    }: {
      message: string;
      sessionId?: number;
    }) => sendQuery(userId, message, sessionId),
    onError: (err: Error & { retryAfter?: number }) => {
      if (err.retryAfter) setRetryAfter(err.retryAfter);
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === "assistant" && next[i].content === "…") {
            next.splice(i, 1);
            break;
          }
        }
        next.push({
          id: genId(),
          role: "error",
          content: err.retryAfter
            ? `Too many requests. Try again in ${err.retryAfter} seconds. This demo caps how often each visitor can ask, so it stays available for everyone.`
            : `The agent could not answer that. ${err.message}. Try rephrasing the question.`,
        });
        return next;
      });
    },
    onSuccess: (resp: AgentResponse, vars) => {
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === "assistant" && next[i].content === "…") {
            next.splice(i, 1);
            break;
          }
        }
        next.push({
          id: genId(),
          role: "assistant",
          content: resp.answer,
          data: resp.data,
          chartConfig: resp.chartConfig,
          followUp: resp.followUp,
          sql: resp.sql,
          messageId: resp.messageId,
        });
        return next;
      });
      if (!vars.sessionId) onSessionChange(resp.sessionId);
      qc.invalidateQueries({ queryKey: ["sessions", userId] });
    },
  });

  const send = (rawText: string) => {
    const text = rawText.trim();
    if (!text || mutation.isPending) return;

    setMessages((prev) => [
      ...prev,
      { id: genId(), role: "user", content: text },
      { id: genId(), role: "assistant", content: "…" },
    ]);
    setRetryAfter(null);
    mutation.mutate({
      message: text,
      sessionId: currentSessionId ?? undefined,
    });
  };

  return { send, isPending: mutation.isPending };
}
