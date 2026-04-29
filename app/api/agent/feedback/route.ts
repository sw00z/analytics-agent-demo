// POST /api/agent/feedback — capture thumbs-up/down + optional comment.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveFeedback } from "@/lib/db/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  sessionId: z.number().int().positive(),
  messageId: z.number().int().positive().optional(),
  rating: z.enum(["positive", "negative"]),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-demo-user") ?? "anon";

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  const row = await saveFeedback({ ...body, userId });
  return NextResponse.json({ feedback: row }, { status: 201 });
}
