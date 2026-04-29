// Drizzle queries for agent persistence (sessions, messages, feedback).
// Kept thin: route handlers compose these — no business logic here.

import { eq, and, desc } from "drizzle-orm";
import { db } from "./client";
import { agentSessions, agentMessages, agentFeedback } from "./schema";

const TENANT_ID = Number(process.env.DEMO_TENANT_ID ?? "1");

export async function listSessions(userId: string) {
  return db
    .select()
    .from(agentSessions)
    .where(
      and(
        eq(agentSessions.tenantId, TENANT_ID),
        eq(agentSessions.userId, userId),
      ),
    )
    .orderBy(desc(agentSessions.updatedAt));
}

export async function createSession(userId: string, title: string) {
  const [row] = await db
    .insert(agentSessions)
    .values({ tenantId: TENANT_ID, userId, title })
    .returning();
  return row;
}

export async function getSession(sessionId: number, userId: string) {
  const [session] = await db
    .select()
    .from(agentSessions)
    .where(
      and(
        eq(agentSessions.id, sessionId),
        eq(agentSessions.tenantId, TENANT_ID),
        eq(agentSessions.userId, userId),
      ),
    )
    .limit(1);
  if (!session) return null;

  const messages = await db
    .select()
    .from(agentMessages)
    .where(eq(agentMessages.sessionId, sessionId))
    .orderBy(agentMessages.createdAt);

  return { session, messages };
}

export async function updateSessionTitle(
  sessionId: number,
  userId: string,
  title: string,
) {
  const [row] = await db
    .update(agentSessions)
    .set({ title, updatedAt: new Date() })
    .where(
      and(
        eq(agentSessions.id, sessionId),
        eq(agentSessions.tenantId, TENANT_ID),
        eq(agentSessions.userId, userId),
      ),
    )
    .returning();
  return row;
}

export async function deleteSession(sessionId: number, userId: string) {
  await db
    .delete(agentMessages)
    .where(eq(agentMessages.sessionId, sessionId));
  await db
    .delete(agentSessions)
    .where(
      and(
        eq(agentSessions.id, sessionId),
        eq(agentSessions.tenantId, TENANT_ID),
        eq(agentSessions.userId, userId),
      ),
    );
}

export async function touchSession(sessionId: number) {
  await db
    .update(agentSessions)
    .set({ updatedAt: new Date() })
    .where(eq(agentSessions.id, sessionId));
}

export async function saveUserMessage(sessionId: number, content: string) {
  const [row] = await db
    .insert(agentMessages)
    .values({ sessionId, role: "user", content })
    .returning();
  return row;
}

export async function saveAssistantMessage(
  sessionId: number,
  content: string,
  options: {
    query?: string | null;
    data?: unknown;
    chartConfig?: unknown;
    followUpQuestions?: string[] | null;
  },
) {
  const [row] = await db
    .insert(agentMessages)
    .values({
      sessionId,
      role: "assistant",
      content,
      query: options.query ?? null,
      data: (options.data as never) ?? null,
      chartConfig: (options.chartConfig as never) ?? null,
      followUpQuestions: (options.followUpQuestions as never) ?? null,
    })
    .returning();
  return row;
}

export async function saveFeedback(input: {
  sessionId: number;
  messageId?: number;
  userId: string;
  rating: "positive" | "negative";
  comment?: string;
}) {
  const [row] = await db
    .insert(agentFeedback)
    .values({
      tenantId: TENANT_ID,
      sessionId: input.sessionId,
      messageId: input.messageId ?? null,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment ?? null,
    })
    .returning();
  return row;
}
