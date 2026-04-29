"use client";

// Owns the message-list state for the chat panel. Hydrates from
// /api/agent/sessions/:id when a session is opened, resets to [] when the
// caller passes a null sessionId (fresh chat).

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSession, type SessionMessage } from "@/lib/api/agent";
import type { DisplayMessage } from "@/components/chat/MessageBubble";

function hydrateMessages(rows: SessionMessage[]): DisplayMessage[] {
  return rows.map((row) => {
    if (row.role === "user") {
      return {
        id: `db-${row.id}`,
        role: "user",
        content: row.content,
      };
    }
    return {
      id: `db-${row.id}`,
      role: "assistant",
      content: row.content,
      data: row.data ?? undefined,
      chartConfig: row.chartConfig ?? undefined,
      followUp: row.followUpQuestions ?? undefined,
      sql: row.query ?? undefined,
      messageId: row.id,
    };
  });
}

export function useSessionMessages(
  userId: string,
  currentSessionId: number | null,
) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);

  const { data: sessionData } = useQuery({
    queryKey: ["session", currentSessionId, userId],
    queryFn: () =>
      currentSessionId ? getSession(userId, currentSessionId) : null,
    enabled: !!currentSessionId && !!userId,
  });

  // Sync local optimistic state from the query cache. Local state is needed
  // because send() appends before the server round-trip lands.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (currentSessionId === null) {
      setMessages([]);
      return;
    }
    if (sessionData) {
      setMessages(hydrateMessages(sessionData.messages));
    }
  }, [currentSessionId, sessionData]);

  return { messages, setMessages };
}
