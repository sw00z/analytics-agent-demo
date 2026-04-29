// BI Middleware — history truncation + dynamic prompt assembly.
//
// wrapModelCall appends current_date AFTER BI_SYSTEM_PROMPT_PREFIX so the
// static prefix remains byte-identical across invocations (OpenAI prompt cache
// requires byte equivalence ≥ 1024 tokens). Do not move dynamic values into
// the prefix. See lib/ai/prompts/biSystemPrompt.ts for the cache-stability contract.

import { createMiddleware } from "langchain";
import { RemoveMessage } from "@langchain/core/messages";
import { REMOVE_ALL_MESSAGES } from "@langchain/langgraph";
import { BI_SYSTEM_PROMPT_PREFIX } from "../prompts/biSystemPrompt";
import { formattedExamples } from "../prompts/biFewShot";

const MAX_HISTORY_MESSAGES = 20;

export const biMiddleware = createMiddleware({
  name: "BIMiddleware",

  // Trim conversation history before each model call to cap token cost.
  // Keeps the first message + the most recent N messages.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beforeModel: (state: any) => {
    const messages = state.messages;
    if (!messages || messages.length <= MAX_HISTORY_MESSAGES) {
      return;
    }

    const firstMsg = messages[0];
    const recentMessages = messages.slice(-(MAX_HISTORY_MESSAGES - 1));

    return {
      messages: [
        new RemoveMessage({ id: REMOVE_ALL_MESSAGES }),
        firstMsg,
        ...recentMessages,
      ],
    };
  },

  // Inject formatted SQL examples + current_date into system prompt
  // per-invocation. The static prefix is cacheable; only the suffix changes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wrapModelCall: (request: any, handler: any) => {
    const currentDate = new Date().toISOString().split("T")[0];
    const dynamicPrompt = formattedExamples
      ? `${BI_SYSTEM_PROMPT_PREFIX}\n\n${formattedExamples}\n\nCurrent date: ${currentDate}`
      : `${BI_SYSTEM_PROMPT_PREFIX}\n\nCurrent date: ${currentDate}`;

    return handler({
      ...request,
      systemPrompt: dynamicPrompt,
    });
  },
});
