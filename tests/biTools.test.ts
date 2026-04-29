// SQL safety tests — the prized layer.
//
// These tests prove the four guardrails defined in lib/ai/tools/biTools.ts:
//   1. SELECT/WITH only — no DML/DDL
//   2. Single statement — no chained semicolons
//   3. Keyword blocklist — no INSERT/UPDATE/DELETE/DROP/etc., even when
//      hidden in string literals (literal stripping happens before checks)
//   4. Table allowlist — only the 9 Olist analytical tables
// Plus LIMIT enforcement (default 100, cap 500).

import { describe, it, expect } from "vitest";
import { sanitizeSqlQuery } from "@/lib/ai/tools/biTools";

describe("sanitizeSqlQuery", () => {
  describe("statement type", () => {
    it("allows SELECT", () => {
      const result = sanitizeSqlQuery(
        "SELECT order_id FROM orders WHERE tenant_id = $TENANT_ID",
      );
      expect(result.ok).toBe(true);
    });

    it("allows WITH (CTEs)", () => {
      const result = sanitizeSqlQuery(
        "WITH x AS (SELECT 1 AS n) SELECT * FROM orders WHERE tenant_id = $TENANT_ID",
      );
      expect(result.ok).toBe(true);
    });

    it("rejects non-SELECT/WITH statements", () => {
      const result = sanitizeSqlQuery("PRAGMA foo");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/SELECT/);
      }
    });
  });

  describe("multiple statements", () => {
    it("blocks chained statements", () => {
      const result = sanitizeSqlQuery(
        "SELECT * FROM orders WHERE tenant_id = $TENANT_ID; SELECT 1",
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/Multiple statements/i);
      }
    });

    it("allows a trailing semicolon", () => {
      const result = sanitizeSqlQuery(
        "SELECT * FROM orders WHERE tenant_id = $TENANT_ID;",
      );
      expect(result.ok).toBe(true);
    });
  });

  describe("DML/DDL blocklist", () => {
    const blocked = [
      "INSERT INTO orders SELECT * FROM customers WHERE tenant_id = $TENANT_ID",
      "UPDATE orders SET tenant_id = $TENANT_ID",
      "DELETE FROM orders WHERE tenant_id = $TENANT_ID",
      "SELECT * FROM orders WHERE tenant_id = $TENANT_ID; DROP TABLE orders",
      "SELECT * FROM orders WHERE tenant_id = $TENANT_ID UNION SELECT * FROM orders TRUNCATE x",
    ];

    it.each(blocked)("blocks: %s", (query) => {
      const result = sanitizeSqlQuery(query);
      expect(result.ok).toBe(false);
    });

    it("does not flag blocklisted words inside string literals", () => {
      const result = sanitizeSqlQuery(
        "SELECT * FROM orders WHERE tenant_id = $TENANT_ID AND order_status = 'INSERT'",
      );
      expect(result.ok).toBe(true);
    });
  });

  describe("table allowlist", () => {
    it("allows queries against analytical tables", () => {
      const result = sanitizeSqlQuery(
        "SELECT * FROM orders JOIN order_items ON 1=1 WHERE orders.tenant_id = $TENANT_ID",
      );
      expect(result.ok).toBe(true);
    });

    it("blocks queries against unknown tables", () => {
      const result = sanitizeSqlQuery(
        "SELECT * FROM pg_user WHERE tenant_id = $TENANT_ID",
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/pg_user/);
      }
    });

    it("blocks queries against agent_* tables (not in allowlist)", () => {
      const result = sanitizeSqlQuery(
        "SELECT * FROM agent_sessions WHERE tenant_id = $TENANT_ID",
      );
      expect(result.ok).toBe(false);
    });
  });

  describe("LIMIT enforcement", () => {
    it("appends DEFAULT_LIMIT when LIMIT is missing", () => {
      const result = sanitizeSqlQuery(
        "SELECT * FROM orders WHERE tenant_id = $TENANT_ID",
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.sql).toMatch(/LIMIT 100/);
      }
    });

    it("preserves user LIMIT when within cap", () => {
      const result = sanitizeSqlQuery(
        "SELECT * FROM orders WHERE tenant_id = $TENANT_ID LIMIT 50",
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.sql).toMatch(/LIMIT 50/);
      }
    });

    it("caps LIMIT at MAX_LIMIT (500)", () => {
      const result = sanitizeSqlQuery(
        "SELECT * FROM orders WHERE tenant_id = $TENANT_ID LIMIT 99999",
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.sql).toMatch(/LIMIT 500/);
        expect(result.sql).not.toMatch(/LIMIT 99999/);
      }
    });
  });
});
