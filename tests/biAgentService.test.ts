// extractToolSql — pulls the SQL the LLM authored from the agent's message
// trace. We surface it pre-tenant-injection so the displayed query is
// portable + copyable.

import { describe, it, expect } from "vitest";
import { extractToolSql } from "@/lib/ai/biAgentService";

// Minimal AIMessage shape: only the fields extractToolSql inspects.
function aiMessage(toolCalls: Array<{ name: string; args: unknown }>) {
  return {
    constructor: { name: "AIMessage" },
    _getType: () => "ai",
    tool_calls: toolCalls,
  };
}

function humanMessage(content: string) {
  return {
    constructor: { name: "HumanMessage" },
    _getType: () => "human",
    content,
  };
}

describe("extractToolSql", () => {
  it("returns undefined when there are no tool calls", () => {
    const result = { messages: [humanMessage("how many orders?")] };
    expect(extractToolSql(result)).toBeUndefined();
  });

  it("returns the most recent execute_sql query string", () => {
    const sql = "SELECT COUNT(*) FROM orders WHERE tenant_id = $TENANT_ID";
    const result = {
      messages: [
        humanMessage("how many orders?"),
        aiMessage([{ name: "execute_sql", args: { query: sql } }]),
      ],
    };
    expect(extractToolSql(result)).toBe(sql);
  });

  it("prefers the latest execute_sql call when multiple turns exist", () => {
    const oldSql = "SELECT 1 FROM orders WHERE tenant_id = $TENANT_ID";
    const newSql = "SELECT 2 FROM order_items WHERE tenant_id = $TENANT_ID";
    const result = {
      messages: [
        aiMessage([{ name: "execute_sql", args: { query: oldSql } }]),
        humanMessage("now break it down by category"),
        aiMessage([{ name: "execute_sql", args: { query: newSql } }]),
      ],
    };
    expect(extractToolSql(result)).toBe(newSql);
  });

  it("ignores tool calls that aren't execute_sql", () => {
    const result = {
      messages: [
        aiMessage([{ name: "some_other_tool", args: { query: "noise" } }]),
      ],
    };
    expect(extractToolSql(result)).toBeUndefined();
  });

  it("ignores calls with non-string query args (defensive)", () => {
    const result = {
      messages: [aiMessage([{ name: "execute_sql", args: { query: 42 } }])],
    };
    expect(extractToolSql(result)).toBeUndefined();
  });
});
