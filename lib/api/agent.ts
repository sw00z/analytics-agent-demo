// Client-side fetch helpers. TanStack Query mutations / queries
// compose these. All requests carry the X-Demo-User header.

export interface ChartConfig {
  type:
    | "bar"
    | "horizontal_bar"
    | "stacked_bar"
    | "line"
    | "area"
    | "pie"
    | "scatter"
    | "table";
  xAxis?: string;
  yAxis?: string;
  dataKey?: string;
  /** Required only for 'stacked_bar' — lists the numeric columns to stack.
   *  Null for every other chart type (kept required-but-nullable so the
   *  agent's structured-output schema satisfies OpenAI strict mode). */
  series?: string[] | null;
}

export interface AgentResponse {
  sessionId: number;
  messageId: number;
  type: "bi_data" | "bi_conversational" | "bi_error";
  answer: string;
  data?: Record<string, unknown>[];
  chartConfig?: ChartConfig;
  followUp?: string[];
  /** SQL the agent generated for this turn — present only on bi_data turns. */
  sql?: string;
}

export interface SessionSummary {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionMessage {
  id: number;
  sessionId: number;
  role: "user" | "assistant";
  content: string;
  data?: Record<string, unknown>[] | null;
  followUpQuestions?: string[] | null;
  /** Persisted SQL for assistant turns that ran a query. */
  query?: string | null;
  /** Persisted chart config so the chart re-renders on rehydrate. */
  chartConfig?: ChartConfig | null;
  createdAt: string;
}

export interface RateLimitError {
  error: string;
  retryAfter: number;
}

const DEMO_USER_HEADER = "x-demo-user";

function headers(userId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    [DEMO_USER_HEADER]: userId,
  };
}

export async function sendQuery(
  userId: string,
  message: string,
  sessionId?: number,
): Promise<AgentResponse> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: headers(userId),
    body: JSON.stringify({ message, sessionId }),
  });
  if (res.status === 429) {
    const body = (await res.json()) as RateLimitError;
    const err = new Error(body.error) as Error & { retryAfter?: number };
    err.retryAfter = body.retryAfter;
    throw err;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function listSessions(userId: string): Promise<SessionSummary[]> {
  const res = await fetch("/api/agent/sessions", {
    headers: { [DEMO_USER_HEADER]: userId },
  });
  if (!res.ok) throw new Error("Failed to load sessions");
  const body = (await res.json()) as { sessions: SessionSummary[] };
  return body.sessions;
}

export async function getSession(
  userId: string,
  sessionId: number,
): Promise<{ session: SessionSummary; messages: SessionMessage[] }> {
  const res = await fetch(`/api/agent/sessions/${sessionId}`, {
    headers: { [DEMO_USER_HEADER]: userId },
  });
  if (!res.ok) throw new Error("Failed to load session");
  return res.json();
}

export async function deleteSession(
  userId: string,
  sessionId: number,
): Promise<void> {
  const res = await fetch(`/api/agent/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { [DEMO_USER_HEADER]: userId },
  });
  if (!res.ok) throw new Error("Failed to delete session");
}

export async function renameSession(
  userId: string,
  sessionId: number,
  title: string,
): Promise<void> {
  const res = await fetch(`/api/agent/sessions/${sessionId}`, {
    method: "PUT",
    headers: headers(userId),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to rename session");
}

export async function submitFeedback(
  userId: string,
  input: {
    sessionId: number;
    messageId?: number;
    rating: "positive" | "negative";
    comment?: string;
  },
): Promise<void> {
  const res = await fetch("/api/agent/feedback", {
    method: "POST",
    headers: headers(userId),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to submit feedback");
}
