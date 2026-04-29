// GET  /api/agent/sessions — list sessions for the current demo user
// POST /api/agent/sessions — create an empty session (rare; usually auto-created)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, listSessions } from "@/lib/db/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getUserId(req: NextRequest): string {
  return req.headers.get("x-demo-user") ?? "anon";
}

export async function GET(req: NextRequest) {
  const sessions = await listSessions(getUserId(req));
  return NextResponse.json({ sessions });
}

const createSchema = z.object({
  title: z.string().min(1).max(80).optional(),
});

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const body = createSchema.parse(await req.json().catch(() => ({})));
  const session = await createSession(userId, body.title ?? "New chat");
  return NextResponse.json({ session }, { status: 201 });
}
