// BI Agent Service — Thin invocation layer for the analytics agent.
//
// Responsibilities limited to what can't live in the agent itself:
//   - HTTP ↔ LangChain message boundary (plain objects → LangChain messages)
//   - Optional Langfuse CallbackHandler attachment
//   - Tool data extraction (raw SQL rows from tool messages → HTTP response)
// Session title generation lives in lib/ai/sessionTitle.ts.

import { CallbackHandler } from "@langfuse/langchain";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { biAgent } from "./biAgent";
import { type BIAgentResponse, type ChartConfig } from "./schemas/biAgentResponse";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BIAgentRequest {
  query: string;
  tenantId: number;
  sessionId?: number | string;
  userId?: string;
  chatHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface BIAgentServiceResponse {
  answer: string;
  type: "bi_data" | "bi_conversational" | "bi_error";
  data?: unknown[];
  // ChartConfig from the Zod schema — all fields required when present (bi_data guarantees population).
  chartConfig?: ChartConfig;
  followUp?: string[];
  /** SQL the agent generated for this turn (pre-tenant-injection). Present
   *  only when the agent invoked execute_sql. */
  sql?: string;
}

// ---------------------------------------------------------------------------
// Langfuse — optional. When env vars are absent, we skip the callback
// entirely; the agent runs without observability but otherwise unchanged.
// ---------------------------------------------------------------------------

function buildLangfuseCallbacks(req: BIAgentRequest) {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    return [];
  }
  return [
    new CallbackHandler({
      sessionId: req.sessionId ? String(req.sessionId) : undefined,
      userId: req.userId,
      version: "v1",
      tags: ["bi-agent", `tenant:${req.tenantId}`],
    }),
  ];
}

// ---------------------------------------------------------------------------
// Invoke BI Agent
// ---------------------------------------------------------------------------

export async function invokeBIAgent(
  req: BIAgentRequest,
): Promise<BIAgentServiceResponse> {
  // Convert plain chat history objects to LangChain message instances.
  // History truncation is handled by the agent's beforeModel middleware.
  const history = (req.chatHistory ?? []).map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content),
  );

  const result = await biAgent.invoke(
    { messages: [...history, new HumanMessage(req.query)] },
    {
      context: {
        tenantId: req.tenantId,
        sessionId: req.sessionId,
        userId: req.userId,
      },
      configurable: {
        tenantId: req.tenantId,
      },
      callbacks: buildLangfuseCallbacks(req),
    },
  );

  // structuredResponse is typed by responseFormat (BIResponseSchema)
  const wrapped = (result as { structuredResponse: { response: BIAgentResponse } })
    .structuredResponse;
  const biResponse = wrapped.response;

  const base: BIAgentServiceResponse = {
    answer: biResponse.answer,
    type: biResponse.type,
    followUp: biResponse.followUp,
  };

  if (biResponse.type === "bi_data") {
    return {
      ...base,
      data: extractToolData(result),
      chartConfig: biResponse.chartConfig,
      sql: extractToolSql(result),
    };
  }

  return base;
}

// ---------------------------------------------------------------------------
// Extract raw SQL result rows from the agent's tool messages.
// The structuredResponse contains the LLM's summary + chartConfig,
// but the actual data[] comes from execute_sql's tool output.
// ---------------------------------------------------------------------------

function extractToolData(result: unknown): unknown[] | undefined {
  const messages = (result as { messages?: unknown[] }).messages ?? [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i] as {
      constructor?: { name?: string };
      _getType?: () => string;
      content?: unknown;
    };
    if (
      msg.constructor?.name === "ToolMessage" ||
      msg._getType?.() === "tool"
    ) {
      try {
        const parsed = JSON.parse(
          typeof msg.content === "string" ? msg.content : "",
        );
        if (parsed.ok && Array.isArray(parsed.data)) {
          return parsed.data;
        }
      } catch {
        // Not JSON or no data field — skip
      }
    }
  }
  return undefined;
}

// Walk back through AI messages to find the most recent execute_sql tool call.
// We surface the SQL the LLM authored (still containing $TENANT_ID) — that's
// what we want to display: a tenant-agnostic, copyable query.
// Exported for unit testing; the public surface is `invokeBIAgent`.
export function extractToolSql(result: unknown): string | undefined {
  const messages = (result as { messages?: unknown[] }).messages ?? [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i] as {
      constructor?: { name?: string };
      _getType?: () => string;
      tool_calls?: Array<{ name?: string; args?: { query?: unknown } }>;
    };
    const isAi = msg.constructor?.name === "AIMessage" || msg._getType?.() === "ai";
    if (!isAi) continue;
    const calls = msg.tool_calls ?? [];
    for (let j = calls.length - 1; j >= 0; j--) {
      const call = calls[j];
      if (call?.name === "execute_sql" && typeof call.args?.query === "string") {
        return call.args.query;
      }
    }
  }
  return undefined;
}

