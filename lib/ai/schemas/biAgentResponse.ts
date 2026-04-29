// BI Agent — Response Schema
// Used by biAgent.ts as its responseFormat.
//
// NOTE: Sub-schemas are defined inline per variant to avoid $ref generation
// in zodToJsonSchema. OpenAI strict structured output requires all $refs
// at top-level $defs, which zodToJsonSchema cannot guarantee for shared
// objects inside anyOf.

import { z } from "zod";

const ChartConfigSchema = z.object({
  type: z
    .enum([
      "bar",
      "horizontal_bar",
      "stacked_bar",
      "line",
      "area",
      "pie",
      "scatter",
      "table",
    ])
    .describe(
      "Chart type: 'table' for detailed records, 'bar' for vertical comparisons, 'horizontal_bar' for ranked lists with long category labels, 'stacked_bar' for compositional comparisons across categories (requires 'series'), 'line' for time series, 'area' for time series with magnitude emphasis, 'pie' for proportional distributions, 'scatter' for two-variable correlation",
    ),
  xAxis: z
    .string()
    .describe(
      "Column name for X axis / category labels. For 'scatter', this is the numeric column on the X axis.",
    ),
  yAxis: z
    .string()
    .describe(
      "Column name for Y axis / values. For 'scatter', this is the numeric column on the Y axis.",
    ),
  dataKey: z
    .string()
    .describe(
      "Column name containing the primary numeric value to plot. For 'stacked_bar', this is unused — pass any series column name; the actual stacked columns are listed in 'series'.",
    ),
  series: z
    .array(z.string())
    .nullable()
    .describe(
      "Required only for 'stacked_bar' — pass null for all other chart types. Lists the numeric column names to stack within each xAxis category (e.g. ['credit_card_total', 'boleto_total', 'voucher_total']).",
    ),
});

const BIDataResponse = z.object({
  type: z.literal("bi_data"),
  answer: z
    .string()
    .describe(
      "Natural language summary of the query results with actionable insights",
    ),
  chartConfig: ChartConfigSchema,
  followUp: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe("1-4 contextual follow-up questions"),
});

const BIConversationalResponse = z.object({
  type: z.literal("bi_conversational"),
  answer: z
    .string()
    .describe("Conversational response when no data query is needed"),
  followUp: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe("1-4 suggested questions to explore"),
});

const BIErrorResponse = z.object({
  type: z.literal("bi_error"),
  answer: z
    .string()
    .describe("Explanation of why the query could not be answered"),
  followUp: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe("1-4 alternative questions the user can try"),
});

const BIResponseUnion = z.discriminatedUnion("type", [
  BIDataResponse,
  BIConversationalResponse,
  BIErrorResponse,
]);

export type BIAgentResponse = z.infer<typeof BIResponseUnion>;

// Wrapped in z.object() because LangChain's responseFormat only accepts
// ZodObject instances — z.discriminatedUnion is not recognized by
// isInteropZodObject() in @langchain/core.
export const BIResponseSchema = z.object({
  response: BIResponseUnion,
});
