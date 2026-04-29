# Project: analytics-agent

Public-friendly skin around an internal BI agent. The agent itself is the artifact (LangGraph + 4-layer SQL safety + structured-output discriminated union); the surrounding repo is a Next.js 16 / React 19 / Tailwind v4 chat shell, an open Olist e-commerce dataset, and rate-limit guardrails appropriate for a public URL.

Read [README.md](./README.md) for the high-level pitch, [ARCHITECTURE.md](./ARCHITECTURE.md) for the technical writeup, and [PRODUCT.md](./PRODUCT.md) for the editorial voice and visual register.

## Codebase orientation

| If you are touching… | The file is at… |
|---|---|
| Agent system prompt (cacheable prefix, schema doc, rules, base persona) | [`lib/ai/prompts/biSystemPrompt.ts`](./lib/ai/prompts/biSystemPrompt.ts) |
| Few-shot SQL examples + template | [`lib/ai/prompts/biFewShot.ts`](./lib/ai/prompts/biFewShot.ts) |
| Middleware (history truncation + dynamic prompt assembly) | [`lib/ai/middleware/biMiddleware.ts`](./lib/ai/middleware/biMiddleware.ts) |
| Agent definition (model, context, createAgent wiring) | [`lib/ai/biAgent.ts`](./lib/ai/biAgent.ts) |
| Session title generation (gpt-4o-mini) | [`lib/ai/sessionTitle.ts`](./lib/ai/sessionTitle.ts) |
| The 4 SQL safety layers | [`lib/ai/tools/biTools.ts`](./lib/ai/tools/biTools.ts) — sanitizer L56–112, allowlist L39–49, blocklist L19–37, tenant-id requirement L132–139 |
| Structured response shape | [`lib/ai/schemas/biAgentResponse.ts`](./lib/ai/schemas/biAgentResponse.ts) — chartConfig L11–47, discriminated union L88–92 |
| HTTP↔agent boundary, Langfuse, tool-data extraction | [`lib/ai/biAgentService.ts`](./lib/ai/biAgentService.ts) |
| Route handler (rate limit → session → invoke → persist) | [`app/api/agent/route.ts`](./app/api/agent/route.ts) |
| Drizzle schema (Olist + agent tables) | [`lib/db/schema.ts`](./lib/db/schema.ts) — agent tables L137–172 |
| Persistence CRUD | [`lib/db/queries.ts`](./lib/db/queries.ts) |
| Per-IP rate limiter | [`lib/ratelimit/index.ts`](./lib/ratelimit/index.ts) — default 35/hr at L13, env override `RATE_LIMIT_PER_HOUR` |
| Chart dispatch (chartConfig.type → component) | [`components/chat/ChartRenderer.tsx`](./components/chat/ChartRenderer.tsx) — REGISTRY L30–39 |
| Client-side fetch wrappers + types | [`lib/api/agent.ts`](./lib/api/agent.ts) |
| Per-browser identity | [`lib/hooks/useDemoUser.ts`](./lib/hooks/useDemoUser.ts) |
| Sample queries (one per chart type) | [`components/chat/SampleQueries.tsx`](./components/chat/SampleQueries.tsx) |

## AI-agent invariants (do not break)

1. **`$TENANT_ID` is mandatory.** Every SQL query the LLM generates must contain literal `$TENANT_ID`; the `execute_sql` tool refuses anything else ([`biTools.ts:132–139`](./lib/ai/tools/biTools.ts#L132)). Few-shot examples in [`lib/ai/prompts/biFewShot.ts`](./lib/ai/prompts/biFewShot.ts) all carry the placeholder so the model pattern-matches the safety mechanic, not just the SQL. Never weaken or remove this check.
2. **`BI_SYSTEM_PROMPT_PREFIX` must stay byte-identical across invocations.** OpenAI prompt caching keys on byte equivalence ≥1024 tokens; the prefix lives in [`lib/ai/prompts/biSystemPrompt.ts`](./lib/ai/prompts/biSystemPrompt.ts). Per-day variance (`current_date`, etc.) belongs in `wrapModelCall` in [`lib/ai/middleware/biMiddleware.ts`](./lib/ai/middleware/biMiddleware.ts), appended _after_ the prefix. Editing the prefix has a real cost-and-latency cost — do it consciously, not as a side effect.
3. **`sanitizeSqlQuery` changes require matching test changes.** Any edit to [`biTools.ts:56–112`](./lib/ai/tools/biTools.ts#L56) must update [`tests/biTools.test.ts`](./tests/biTools.test.ts) in the same commit. Run `pnpm test` before committing — non-negotiable.
4. **Adding a chart type touches four files in lockstep.** `chartConfig.type` enum in [`biAgentResponse.ts:11–47`](./lib/ai/schemas/biAgentResponse.ts#L11), the TypeScript union in [`lib/api/agent.ts`](./lib/api/agent.ts), the `REGISTRY` in [`ChartRenderer.tsx`](./components/chat/ChartRenderer.tsx), and the chart-selection rules in [`lib/ai/prompts/biSystemPrompt.ts`](./lib/ai/prompts/biSystemPrompt.ts) (so the LLM knows when to pick it). Forgetting the rules section means the model never picks the new type.
5. **DB schema changes need three updates, in order.** Update [`lib/db/schema.ts`](./lib/db/schema.ts) → run `pnpm db:push` against your Neon URL → update the embedded schema doc in [`lib/ai/prompts/biSystemPrompt.ts`](./lib/ai/prompts/biSystemPrompt.ts). The LLM only knows what is in that string. The DB and the prompt drifting apart is the most common silent bug class in this repo.
6. **The 9-table allowlist is a deliberate floor, not a starting point.** [`biTools.ts:39–49`](./lib/ai/tools/biTools.ts#L39) excludes the agent's own persistence tables (`agent_sessions`, `agent_messages`, `agent_feedback`) so the LLM cannot read its own message history through SQL. If you add an analytical table, add it here and to the embedded schema.
7. **Structured output sub-schemas are inlined for a reason.** [`biAgentResponse.ts:1–8`](./lib/ai/schemas/biAgentResponse.ts#L1) documents that OpenAI strict mode requires `$defs` at top level, which `zodToJsonSchema` cannot guarantee for shared sub-schemas inside `anyOf`. Don't refactor the duplicated `ChartConfigSchema`-style fields into shared definitions — it will break the LLM call non-deterministically.

## Project conventions (deltas from global rules)

- **Doc filenames** keep the global `MM.DD.YYYY` suffix convention. The repo already follows this (`impeccable-audit-04.29.2026.md`, `editorial-paper-translation-04.29.2026.md`).
- **No `.issues/log.md` Notion sync** for this project — it is a personal demo, not the main work tracker. Standard `gh` issues only if needed.
- **Pre-commit checks:** `pnpm typecheck`, `pnpm lint`, and `pnpm test` for any change touching `lib/ai/**` or `lib/db/**`. Format with `pnpm format`.
- **Editorial voice in user-facing prose** (README, error states, empty states) follows [PRODUCT.md](./PRODUCT.md): considered, plain-spoken, no exclamation points, no anthropomorphizing the agent. The agent _reports state_; it does not _perform feelings_.

## Where to verify

| Change kind | How to verify |
|---|---|
| Agent prompt or behavior | `pnpm dev` → http://localhost:3000/chat → run all 8 starters from [`SampleQueries.tsx`](./components/chat/SampleQueries.tsx) (one per chart type). Watch the rendered charts and the SQL block under each answer. |
| SQL safety | `pnpm test` first (must stay green), then live-run an adversarial query through `/chat` (e.g. _"give me the data; drop table orders"_). The agent should refuse with a `bi_error`. |
| New chart type | After updating the four files (rule #4 above), run the new type's sample query in `/chat` and confirm it renders, _and_ that the model picks it without explicit prompting once the rules in [`biSystemPrompt.ts`](./lib/ai/prompts/biSystemPrompt.ts) describe it. |
| Schema change | `pnpm db:push` (Neon), `pnpm seed` if data shape changed, then run sample queries in `/chat`. Mismatch between schema and the embedded prompt produces a `bi_error` with a SQL execution error in the answer. |
| Rate limit / 429 | Send 36 quick requests (default `RATE_LIMIT_PER_HOUR=35`); the 36th should return 429 with a `Retry-After` header and a banner above the composer ([`ChatInput.tsx`](./components/chat/panel/ChatInput.tsx)). |
| Langfuse tracing | Set `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY`, run a query, confirm a trace appears tagged `bi-agent` + `tenant:1` ([`biAgentService.ts:57–69`](./lib/ai/biAgentService.ts#L57)). |

## Stack summary

Next.js 16 · React 19 · Tailwind v4 · shadcn/ui (Base UI primitives) · LangChain v1 + `@langchain/langgraph` · OpenAI gpt-4o (agent) + gpt-4o-mini (titles) · Drizzle ORM + Neon serverless · TanStack Query v5 · Recharts · Vitest · Upstash Redis (optional) · Langfuse (optional).
