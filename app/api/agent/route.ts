// POST /api/agent — main BI query handler.
//
// Flow:
//   1. Rate-limit by client IP. Returns 429 with Retry-After if exceeded.
//   2. Parse body. If no sessionId, auto-create one with an LLM-generated title.
//   3. Persist the user message.
//   4. Invoke the BI agent (LangGraph + execute_sql tool).
//   5. Persist the assistant message (answer, chartConfig, follow-ups, data).
//   6. Return the structured response.
//
// No auth — the demo is fully open. Cost protection comes from the three-layer
// guardrail: per-IP rate limit (here) + per-request token cap (in biAgent.ts)
// + OpenAI dashboard spend cap.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  invokeBIAgent,
  generateSessionTitle,
} from "@/lib/ai/biAgentService";
import {
  createSession,
  saveUserMessage,
  saveAssistantMessage,
  touchSession,
  getSession,
} from "@/lib/db/queries";
import {
  rateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TENANT_ID = Number(process.env.DEMO_TENANT_ID ?? "1");

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded.",
        retryAfter: Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000),
      },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const userId = req.headers.get("x-demo-user") ?? `anon-${ip}`;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }

  // Resolve or create the session.
  let sessionId = body.sessionId;
  let chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

  if (sessionId) {
    const existing = await getSession(sessionId, userId);
    if (!existing) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404, headers: rateLimitHeaders(rl) },
      );
    }
    chatHistory = existing.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
  } else {
    const title = await generateSessionTitle(body.message);
    const session = await createSession(userId, title);
    sessionId = session.id;
  }

  await saveUserMessage(sessionId, body.message);

  // Invoke the agent.
  let result;
  try {
    result = await invokeBIAgent({
      query: body.message,
      tenantId: TENANT_ID,
      sessionId,
      userId,
      chatHistory,
    });
  } catch (err) {
    console.error("Agent invocation failed", err);
    return NextResponse.json(
      {
        error: "The analytics agent encountered an error.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }

  const savedAssistant = await saveAssistantMessage(sessionId, result.answer, {
    data: result.data,
    chartConfig: result.chartConfig,
    followUpQuestions: result.followUp,
    query: result.sql,
  });
  await touchSession(sessionId);

  return NextResponse.json(
    {
      sessionId,
      messageId: savedAssistant.id,
      ...result,
    },
    { headers: rateLimitHeaders(rl) },
  );
}
