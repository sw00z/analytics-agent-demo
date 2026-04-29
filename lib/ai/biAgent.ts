// BI Agent — entry point wiring model + tools + middleware + response format.
//
// Prompt content (persona, DB schema, chart-selection rules):
//   lib/ai/prompts/biSystemPrompt.ts
// Few-shot SQL examples + template:
//   lib/ai/prompts/biFewShot.ts
// Middleware (history truncation + dynamic prompt assembly):
//   lib/ai/middleware/biMiddleware.ts

import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { BI_TOOLS } from "./tools/biTools";
import { BIResponseSchema } from "./schemas/biAgentResponse";
import { biMiddleware } from "./middleware/biMiddleware";

// ---------------------------------------------------------------------------
// Context Schema — declared here (agent identity lives in one entry-point file)
// ---------------------------------------------------------------------------

export const biContextSchema = z.object({
  tenantId: z.number(),
  sessionId: z.union([z.string(), z.number()]).optional(),
  userId: z.string().optional(),
});

export type BIContext = z.infer<typeof biContextSchema>;

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY is not set. Copy .env.example to .env.local and set it.",
  );
}

const model = new ChatOpenAI({
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.1,
  maxTokens: 1500,
});

export const biAgent = createAgent({
  model,
  tools: BI_TOOLS,
  contextSchema: biContextSchema,
  middleware: [biMiddleware],
  responseFormat: BIResponseSchema,
});
