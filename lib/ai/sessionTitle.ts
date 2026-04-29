// Session Title — lightweight gpt-4o-mini call to name new chat sessions.
// Separated from biAgentService.ts so the title-generation concern
// doesn't inflate the HTTP boundary file.

import { ChatOpenAI } from "@langchain/openai";

let titleModel: ChatOpenAI | null = null;

function getTitleModel(): ChatOpenAI {
  if (titleModel) return titleModel;
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  titleModel = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.3,
    maxTokens: 20,
  });
  return titleModel;
}

export async function generateSessionTitle(query: string): Promise<string> {
  try {
    const response = await getTitleModel().invoke([
      {
        role: "system",
        content:
          "You are a title generator for business intelligence chat sessions. " +
          "Generate a short, descriptive title (max 50 characters) that captures " +
          "the essence of the user's query. Focus on the key business metric or question. " +
          "Examples: 'Revenue Analysis Q4', 'Top Categories', 'Payment Type Breakdown'",
      },
      { role: "user", content: query },
    ]);

    const title =
      typeof response.content === "string"
        ? response.content.trim()
        : "BI Chat Session";
    return title.length > 50 ? title.substring(0, 47) + "..." : title;
  } catch (error) {
    console.error("Error generating session title:", error);
    return "BI Chat Session";
  }
}
