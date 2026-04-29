// GET    /api/agent/sessions/:id — fetch a session with its message history
// PUT    /api/agent/sessions/:id — rename the session
// DELETE /api/agent/sessions/:id — delete the session and its messages

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getSession,
  updateSessionTitle,
  deleteSession,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getUserId(req: NextRequest): string {
  return req.headers.get("x-demo-user") ?? "anon";
}

function parseId(idStr: string): number | null {
  const id = Number(idStr);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (!id) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  const result = await getSession(id, getUserId(req));
  if (!result) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json(result);
}

const updateSchema = z.object({
  title: z.string().min(1).max(80),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (!id) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  const body = updateSchema.parse(await req.json());
  const session = await updateSessionTitle(id, getUserId(req), body.title);
  if (!session) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ session });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (!id) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  await deleteSession(id, getUserId(req));
  return NextResponse.json({ ok: true });
}
