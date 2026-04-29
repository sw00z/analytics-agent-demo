// BI Agent — SQL Execution Tool
// Single execute_sql tool for the BI agent. The LLM generates SQL queries
// against the database schema embedded in the system prompt.
//
// Security layers:
//   1. SQL sanitization (SELECT/WITH only, keyword blocklist)
//   2. Table allowlist (only tenant-scoped analytical tables)
//   3. Tenant isolation ($TENANT_ID placeholder, server-side replacement)
//   4. Result size cap (LIMIT enforcement)

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { RunnableConfig } from "@langchain/core/runnables";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

// --- Constants ---

const BLOCKED_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "CREATE",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
  "EXEC",
  "EXECUTE",
  "MERGE",
  "UPSERT",
  "INTO",
  "SET",
  "REPLACE",
  "CALL",
];

const ALLOWED_TABLES = [
  "orders",
  "order_items",
  "order_payments",
  "order_reviews",
  "products",
  "product_category_translation",
  "customers",
  "sellers",
  "geolocation",
];

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

// --- SQL Sanitization (exported for unit testing) ---

export function sanitizeSqlQuery(
  rawSql: string,
): { ok: true; sql: string } | { ok: false; error: string } {
  const trimmed = rawSql.trim();
  const upper = trimmed.toUpperCase();

  // Must start with SELECT or WITH (CTEs)
  if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
    return { ok: false, error: "Only SELECT queries are allowed." };
  }

  // Block multiple statements
  const statements = trimmed.split(";").filter((s) => s.trim().length > 0);
  if (statements.length > 1) {
    return { ok: false, error: "Multiple statements are not allowed." };
  }

  // Strip string literals before keyword checking (avoid false positives)
  const withoutStrings = upper.replace(/'[^']*'/g, "''");

  // Block DML/DDL keywords
  for (const keyword of BLOCKED_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`);
    if (regex.test(withoutStrings)) {
      return { ok: false, error: `Forbidden keyword: ${keyword}` };
    }
  }

  // Table allowlist — extract table references from FROM/JOIN clauses
  const tablePattern = /(?:FROM|JOIN)\s+([a-z_][a-z0-9_]*)/gi;
  let match;
  while ((match = tablePattern.exec(trimmed)) !== null) {
    const tableName = match[1].toLowerCase();
    if (!ALLOWED_TABLES.includes(tableName)) {
      return {
        ok: false,
        error: `Table '${tableName}' is not accessible. Allowed tables: ${ALLOWED_TABLES.join(", ")}`,
      };
    }
  }

  // Enforce LIMIT
  let finalSql = trimmed.replace(/;$/, "");
  if (!upper.includes("LIMIT")) {
    finalSql += ` LIMIT ${DEFAULT_LIMIT}`;
  } else {
    const limitMatch = upper.match(/LIMIT\s+(\d+)/);
    if (limitMatch) {
      const requested = parseInt(limitMatch[1], 10);
      if (requested > MAX_LIMIT) {
        finalSql = finalSql.replace(/LIMIT\s+\d+/i, `LIMIT ${MAX_LIMIT}`);
      }
    }
  }

  return { ok: true, sql: finalSql };
}

// --- Tenant ID Injection ---

function injectTenantId(query: string, tenantId: number): string {
  return query.replace(/\$TENANT_ID/g, String(tenantId));
}

// --- LangChain Tool ---

export const executeSql = tool(
  async (input, config: RunnableConfig) => {
    const tenantId = Number(config.configurable?.tenantId);
    if (!tenantId) {
      return JSON.stringify({
        ok: false,
        error: "Missing tenantId in context.",
      });
    }

    // Require tenant filter
    if (!input.query.includes("$TENANT_ID")) {
      return JSON.stringify({
        ok: false,
        error:
          "Query must include WHERE tenant_id = $TENANT_ID for tenant isolation.",
      });
    }

    // Sanitize
    const sanitized = sanitizeSqlQuery(input.query);
    if (!sanitized.ok) {
      return JSON.stringify({ ok: false, error: sanitized.error });
    }

    // Inject tenant ID
    const finalSql = injectTenantId(sanitized.sql, tenantId);

    try {
      const result = await db.execute(sql.raw(finalSql));
      const rows = Array.isArray(result)
        ? result
        : ((result as { rows?: unknown[] }).rows ?? []);
      return JSON.stringify({
        ok: true,
        rowCount: rows.length,
        data: rows,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return JSON.stringify({
        ok: false,
        error: `SQL execution error: ${message}`,
      });
    }
  },
  {
    name: "execute_sql",
    description:
      "Execute a read-only SQL query against the PostgreSQL database. " +
      "The query MUST include WHERE tenant_id = $TENANT_ID for tenant isolation. " +
      "Only SELECT statements are allowed. Results are limited to 500 rows max. " +
      "Returns JSON with { ok, rowCount, data } on success or { ok: false, error } on failure.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "SQL SELECT query. Must include WHERE tenant_id = $TENANT_ID.",
        ),
    }),
  },
);

export const BI_TOOLS = [executeSql];
