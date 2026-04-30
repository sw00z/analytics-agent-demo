"use client";

// Wraps the sendQuery mutation. Pushes optimistic user message + "…"
// placeholder, swaps the placeholder with the assistant turn on success,
// or replaces it with an error bubble on failure. On 429 with retryAfter,
// surfaces the seconds via the rate-limit hook's setter.
//
// Recovery loops live here. An AbortController per send() lets the user
// stop an in-flight request — AbortError is rendered as a soft "Stopped."
// error bubble so the cancel becomes visible state (rather than a silent
// removal that leaves the user wondering whether the click registered).
// lastQueryRef preserves the last user message so a no-arg `retry()` call
// from the error bubble can resubmit without retyping; the user bubble
// passes its own content as `override` so retries always reflect the
// bubble that was clicked. retry() drops the trailing error bubble before
// sending so the conversation reads as a single continued attempt rather
// than a stutter of failed turns.

import { useRef } from "react";
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
  const abortRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({
      message,
      sessionId,
      signal,
    }: {
      message: string;
      sessionId?: number;
      signal?: AbortSignal;
    }) => sendQuery(userId, message, sessionId, signal),
    onError: (err: Error & { retryAfter?: number }) => {
      const isAbort = err.name === "AbortError";
      if (!isAbort && err.retryAfter) setRetryAfter(err.retryAfter);
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === "assistant" && next[i].content === "…") {
            next.splice(i, 1);
            break;
          }
        }
        if (isAbort) {
          next.push({
            id: genId(),
            role: "error",
            content: "The request was stopped before it finished.",
            errorKind: "aborted",
          });
          return next;
        }
        next.push({
          id: genId(),
          role: "error",
          content: err.retryAfter
            ? `Too many requests. Try again in ${err.retryAfter} seconds. This demo caps how often each visitor can ask, so it stays available for everyone.`
            : `The agent could not answer that. ${err.message}. Try rephrasing the question.`,
          errorKind: err.retryAfter ? "rate_limit" : "agent_error",
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

    const controller = new AbortController();
    abortRef.current = controller;
    lastQueryRef.current = text;

    setMessages((prev) => [
      ...prev,
      { id: genId(), role: "user", content: text },
      { id: genId(), role: "assistant", content: "…" },
    ]);
    setRetryAfter(null);
    mutation.mutate({
      message: text,
      sessionId: currentSessionId ?? undefined,
      signal: controller.signal,
    });
  };

  // User-initiated cancel of the in-flight request. AbortError surfaces in
  // onError, which removes the placeholder and pushes a "Stopped." bubble.
  const cancel = () => {
    abortRef.current?.abort();
  };

  // Re-send a user query. With no argument, falls back to lastQueryRef
  // (used by the trailing error bubble). With an explicit override, retries
  // that specific text — the user-bubble path passes its own content so the
  // retry always reflects the bubble that was clicked, even if lastQueryRef
  // has drifted (e.g. on a hydrated session).
  //
  // Drops trailing error bubbles before re-sending so the conversation
  // reads as a single continued attempt rather than a stutter of failed
  // turns.
  const retry = (override?: string) => {
    const text = (override ?? lastQueryRef.current ?? "").trim();
    if (!text || mutation.isPending) return;
    lastQueryRef.current = text;

    const controller = new AbortController();
    abortRef.current = controller;

    setMessages((prev) => {
      const next = [...prev];
      while (next.length > 0 && next[next.length - 1].role === "error") {
        next.pop();
      }
      next.push({ id: genId(), role: "assistant", content: "…" });
      return next;
    });
    setRetryAfter(null);
    mutation.mutate({
      message: text,
      sessionId: currentSessionId ?? undefined,
      signal: controller.signal,
    });
  };

  return { send, cancel, retry, isPending: mutation.isPending };
}
