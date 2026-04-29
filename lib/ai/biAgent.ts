// BI Agent — Standalone createAgent() for business intelligence
//
// Each agent is self-describing:
//   - Model: gpt-4o (higher reasoning for SQL generation)
//   - Tools: execute_sql only (tenant-isolated, sanitized)
//   - Prompt: Schema + FewShotPromptTemplate SQL examples + rules
//   - Response: BIResponseSchema (bi_data | bi_conversational | bi_error)
//
// Middleware handles:
//   - beforeModel: history truncation (max 20 messages)
//   - wrapModelCall: injects current_date into system prompt per-invocation
//     (date is at END of prompt to preserve the cacheable static prefix)

import { createAgent, createMiddleware } from "langchain";
import { RemoveMessage } from "@langchain/core/messages";
import { REMOVE_ALL_MESSAGES } from "@langchain/langgraph";
import { FewShotPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { BI_TOOLS } from "./tools/biTools";
import { BIResponseSchema } from "./schemas/biAgentResponse";

// ---------------------------------------------------------------------------
// Context Schema
// ---------------------------------------------------------------------------

export const biContextSchema = z.object({
  tenantId: z.number(),
  sessionId: z.union([z.string(), z.number()]).optional(),
  userId: z.string().optional(),
});

export type BIContext = z.infer<typeof biContextSchema>;

// ---------------------------------------------------------------------------
// Few-Shot SQL Examples — Olist e-commerce
//
// Each example exercises a different chart pattern (line, bar, pie, table)
// and a different join shape, so the LLM can pattern-match user questions
// to the right SQL skeleton. Every example uses $TENANT_ID, which the
// execute_sql tool requires as proof of tenant-isolation acknowledgement.
// ---------------------------------------------------------------------------

const SQL_EXAMPLES = [
  {
    question: "Monthly revenue trends across 2017",
    sql: `SELECT
  DATE_TRUNC('month', o.order_purchase_timestamp) AS period,
  COUNT(DISTINCT o.order_id) AS order_count,
  COALESCE(SUM(oi.price), 0) AS total_revenue,
  COALESCE(AVG(oi.price), 0) AS avg_item_price
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.tenant_id = $TENANT_ID
  AND oi.tenant_id = $TENANT_ID
  AND o.order_status = 'delivered'
  AND o.order_purchase_timestamp >= '2017-01-01'
  AND o.order_purchase_timestamp < '2018-01-01'
GROUP BY DATE_TRUNC('month', o.order_purchase_timestamp)
ORDER BY period ASC`,
  },
  {
    question: "Top 10 product categories by revenue",
    sql: `SELECT
  COALESCE(pct.product_category_name_english, p.product_category_name, 'unknown') AS category,
  COUNT(DISTINCT oi.order_id) AS order_count,
  COALESCE(SUM(oi.price), 0) AS total_revenue
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
LEFT JOIN product_category_translation pct
  ON pct.product_category_name = p.product_category_name
  AND pct.tenant_id = $TENANT_ID
WHERE oi.tenant_id = $TENANT_ID
  AND p.tenant_id = $TENANT_ID
GROUP BY category
ORDER BY total_revenue DESC
LIMIT 10`,
  },
  {
    question: "Order distribution by payment type",
    sql: `SELECT
  payment_type,
  COUNT(*) AS payment_count,
  COALESCE(SUM(payment_value), 0) AS total_value,
  COALESCE(AVG(payment_value), 0) AS avg_value
FROM order_payments
WHERE tenant_id = $TENANT_ID
GROUP BY payment_type
ORDER BY payment_count DESC`,
  },
  {
    question: "Top sellers by average review score (min 50 reviews)",
    sql: `SELECT
  s.seller_id,
  s.seller_city,
  s.seller_state,
  COUNT(DISTINCT orv.review_id) AS review_count,
  ROUND(AVG(orv.review_score)::NUMERIC, 2) AS avg_review_score,
  COALESCE(SUM(oi.price), 0) AS total_revenue
FROM sellers s
JOIN order_items oi ON oi.seller_id = s.seller_id
JOIN order_reviews orv ON orv.order_id = oi.order_id
WHERE s.tenant_id = $TENANT_ID
  AND oi.tenant_id = $TENANT_ID
  AND orv.tenant_id = $TENANT_ID
GROUP BY s.seller_id, s.seller_city, s.seller_state
HAVING COUNT(DISTINCT orv.review_id) >= 50
ORDER BY avg_review_score DESC, review_count DESC
LIMIT 20`,
  },
  {
    question: "Average order value by customer state",
    sql: `SELECT
  c.customer_state,
  COUNT(DISTINCT o.order_id) AS order_count,
  COALESCE(SUM(oi.price), 0) AS total_revenue,
  COALESCE(AVG(oi.price), 0) AS avg_item_price
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
WHERE c.tenant_id = $TENANT_ID
  AND o.tenant_id = $TENANT_ID
  AND oi.tenant_id = $TENANT_ID
  AND o.order_status = 'delivered'
GROUP BY c.customer_state
ORDER BY total_revenue DESC`,
  },
  {
    question: "Order status breakdown",
    sql: `SELECT
  order_status,
  COUNT(*) AS order_count
FROM orders
WHERE tenant_id = $TENANT_ID
GROUP BY order_status
ORDER BY order_count DESC`,
  },
  {
    question: "Average delivery time in days, by month",
    sql: `SELECT
  DATE_TRUNC('month', order_purchase_timestamp) AS period,
  COUNT(*) AS delivered_orders,
  ROUND(AVG(EXTRACT(EPOCH FROM (order_delivered_customer_date - order_purchase_timestamp)) / 86400)::NUMERIC, 2) AS avg_delivery_days
FROM orders
WHERE tenant_id = $TENANT_ID
  AND order_status = 'delivered'
  AND order_delivered_customer_date IS NOT NULL
GROUP BY DATE_TRUNC('month', order_purchase_timestamp)
ORDER BY period ASC`,
  },
  {
    question: "Recent orders with customer details",
    sql: `SELECT
  o.order_id,
  o.order_purchase_timestamp,
  o.order_status,
  c.customer_state,
  c.customer_city,
  COUNT(oi.order_item_id) AS item_count,
  COALESCE(SUM(oi.price), 0) AS order_total
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.tenant_id = $TENANT_ID
  AND c.tenant_id = $TENANT_ID
  AND oi.tenant_id = $TENANT_ID
GROUP BY o.order_id, o.order_purchase_timestamp, o.order_status, c.customer_state, c.customer_city
ORDER BY o.order_purchase_timestamp DESC
LIMIT 20`,
  },
];

const exampleTemplate = PromptTemplate.fromTemplate(
  "Question: {question}\nSQL:\n```sql\n{sql}\n```",
);

const fewShotTemplate = new FewShotPromptTemplate({
  examples: SQL_EXAMPLES,
  examplePrompt: exampleTemplate,
  inputVariables: [],
  prefix: "## Example SQL Queries\nUse these as reference for query patterns:",
  suffix: "",
});

// Pre-format examples once at module load
let formattedExamples = "";
fewShotTemplate.format({}).then((s) => (formattedExamples = s));

// ---------------------------------------------------------------------------
// BI Database Schema (embedded in system prompt for SQL generation)
// ---------------------------------------------------------------------------

const BI_SCHEMA = `## Database Schema (PostgreSQL — Olist Brazilian E-Commerce)

### orders
| Column | Type | Description |
|--------|------|-------------|
| order_id | text PK | 32-char hash |
| tenant_id | integer NOT NULL | FK to tenants |
| customer_id | text | FK to customers |
| order_status | text | delivered, shipped, canceled, invoiced, processing, unavailable, approved, created |
| order_purchase_timestamp | timestamp | When the order was placed |
| order_approved_at | timestamp | Payment approval timestamp |
| order_delivered_carrier_date | timestamp | When carrier picked up |
| order_delivered_customer_date | timestamp | When delivered to customer |
| order_estimated_delivery_date | timestamp | Promised delivery date |

### order_items
| Column | Type | Description |
|--------|------|-------------|
| order_id | text | FK to orders (composite key with order_item_id) |
| order_item_id | integer | Sequential number per order (1, 2, 3...) |
| tenant_id | integer NOT NULL | |
| product_id | text | FK to products |
| seller_id | text | FK to sellers |
| shipping_limit_date | timestamp | |
| price | numeric(12,2) | Item price in BRL |
| freight_value | numeric(12,2) | Shipping cost in BRL |

### order_payments
| Column | Type | Description |
|--------|------|-------------|
| order_id | text | FK to orders (composite key with payment_sequential) |
| payment_sequential | integer | Sequence per order (multiple payments possible) |
| tenant_id | integer NOT NULL | |
| payment_type | text | credit_card, boleto, voucher, debit_card, not_defined |
| payment_installments | integer | 1 = paid in full, >1 = installments |
| payment_value | numeric(12,2) | Amount paid in BRL |

### order_reviews
| Column | Type | Description |
|--------|------|-------------|
| review_id | text PK | |
| order_id | text | FK to orders |
| tenant_id | integer NOT NULL | |
| review_score | integer | 1-5 |
| review_comment_title | text | Optional |
| review_comment_message | text | Optional |
| review_creation_date | timestamp | |
| review_answer_timestamp | timestamp | |

### products
| Column | Type | Description |
|--------|------|-------------|
| product_id | text PK | |
| tenant_id | integer NOT NULL | |
| product_category_name | text | Portuguese category (join product_category_translation for English) |
| product_name_length | integer | |
| product_description_length | integer | |
| product_photos_qty | integer | |
| product_weight_g | integer | |
| product_length_cm | integer | |
| product_height_cm | integer | |
| product_width_cm | integer | |

### product_category_translation
| Column | Type | Description |
|--------|------|-------------|
| product_category_name | text PK | Portuguese name |
| tenant_id | integer NOT NULL | |
| product_category_name_english | text | English translation |

### customers
| Column | Type | Description |
|--------|------|-------------|
| customer_id | text PK | Per-order customer reference |
| tenant_id | integer NOT NULL | |
| customer_unique_id | text | Stable identifier across orders (use this to count unique customers) |
| customer_zip_code_prefix | text | |
| customer_city | text | |
| customer_state | text | 2-letter Brazilian state code (SP, RJ, MG, ...) |

### sellers
| Column | Type | Description |
|--------|------|-------------|
| seller_id | text PK | |
| tenant_id | integer NOT NULL | |
| seller_zip_code_prefix | text | |
| seller_city | text | |
| seller_state | text | |

### geolocation
| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | |
| tenant_id | integer NOT NULL | |
| geolocation_zip_code_prefix | text | |
| geolocation_lat | double precision | |
| geolocation_lng | double precision | |
| geolocation_city | text | |
| geolocation_state | text | |

## Relationships

### Hard foreign keys (every child row has a guaranteed parent — INNER JOIN is safe)
- orders.customer_id → customers.customer_id  (one order per customer_id; customer_id is per-order)
- order_items.order_id → orders.order_id      (one order has 1–N items; typical 1–4)
- order_items.product_id → products.product_id
- order_items.seller_id → sellers.seller_id
- order_payments.order_id → orders.order_id   (one order may have multiple payments — credit + voucher etc.; SUM payment_value for true total paid)
- order_reviews.order_id → orders.order_id    (zero or one review per order in practice; PK is review_id)

### Soft reference (use LEFT JOIN — there are gaps)
- products.product_category_name → product_category_translation.product_category_name
  - 610 products have NULL category
  - 13 products reference 2 categories absent from the translation table ('pc_gamer', 'portateis_cozinha_e_preparadores_de_alimentos')
  - To survive both gaps in any aggregation: COALESCE(pct.product_category_name_english, p.product_category_name, 'unknown') AS category

### Geolocation (zip-prefix lookup, NOT a foreign key)
- customers.customer_zip_code_prefix → geolocation.geolocation_zip_code_prefix
- sellers.seller_zip_code_prefix → geolocation.geolocation_zip_code_prefix
- The geolocation table has many rows per prefix (multiple lat/lng samples). Always LEFT JOIN. For mapping, aggregate to a centroid: AVG(geolocation_lat), AVG(geolocation_lng) GROUP BY prefix. For a single representative point, use a subquery with LIMIT 1.
- Some prefixes in customers/sellers do NOT appear in geolocation. LEFT JOIN, never INNER.

### Customer identity nuance
- customer_id is per-order — every order gets a fresh customer_id even for repeat buyers.
- customer_unique_id is the stable identifier across orders. Use COUNT(DISTINCT customer_unique_id) for unique-buyer counts, never COUNT(DISTINCT customer_id).

### Tenant isolation (security-critical)
Every analytical table has tenant_id NOT NULL. EVERY query — including every joined table — must include tenant_id = $TENANT_ID in the WHERE clause. The execute_sql tool will reject any query that does not contain the literal $TENANT_ID placeholder.

### Currency
All monetary values (price, freight_value, payment_value) are in BRL (Brazilian Real). Do not convert. Label outputs with "BRL" when reporting totals.`;

// ---------------------------------------------------------------------------
// BI Rules
// ---------------------------------------------------------------------------

const BI_RULES = `## Chart Selection Rules

- **table**: Use for detailed records with multiple columns (order lists, customer details, top sellers). Use when returning individual records the user can scan.
- **bar**: Use for comparisons across a small number of categories with short labels (revenue by state, orders by month, payment-method totals). xAxis = category name, dataKey = numeric value.
- **horizontal_bar**: Use for ranked lists where category labels are long (top 10 product categories, top sellers, cities). Same fields as 'bar' — xAxis = category name, dataKey = numeric value. Prefer over 'bar' whenever labels would be truncated or rotated.
- **stacked_bar**: Use for compositional comparisons across categories — when each xAxis bucket is itself broken into sub-parts that should sum to a meaningful total (payment-type composition by month, order-status mix by state). Requires 'series': an array of the numeric column names to stack. xAxis = category, series = column names, dataKey = any one of the series columns.
- **line**: Use for time series data tracking a single metric over time (daily revenue, weekly orders, monthly delivery time). xAxis = time period, dataKey = metric value.
- **area**: Use for time series where the magnitude under the curve is itself meaningful (cumulative revenue, total volume over time). Same fields as 'line'.
- **pie**: Use for proportional distributions across a small number (≤6) of categories that sum to a meaningful whole (payment type breakdown, order status share). dataKey = count or sum, xAxis = category name.
- **scatter**: Use for two-variable correlation between numeric measures (price vs review score, freight vs delivery time, order value vs item count). xAxis = numeric column on X, yAxis = numeric column on Y.

Column naming: Use snake_case column names in SQL (e.g. total_revenue, order_count). These become the data keys in chartConfig.

Stacked-bar SQL pattern: emit one row per xAxis category with one numeric column per series member. Example for payment composition by month:
SELECT month, SUM(...) AS credit_card_total, SUM(...) AS boleto_total, SUM(...) AS voucher_total ...
Then chartConfig: { type: "stacked_bar", xAxis: "month", dataKey: "credit_card_total", yAxis: "credit_card_total", series: ["credit_card_total", "boleto_total", "voucher_total"] }.

## Critical Rules
1. EVERY SQL query MUST include WHERE tenant_id = $TENANT_ID for tenant isolation. When joining multiple tables, every joined table must filter on tenant_id.
2. Only generate SELECT queries. Never INSERT, UPDATE, DELETE, DROP, or ALTER.
3. For revenue questions, use SUM(order_items.price) joined to orders. Filter to order_status = 'delivered' unless the user asks about all orders.
4. To count unique customers, use COUNT(DISTINCT customer_unique_id) — customer_id changes per order, customer_unique_id is the stable identity.
5. Always include meaningful column aliases (e.g. AS total_revenue, AS order_count).
6. Use COALESCE for aggregations to avoid null results.
7. Use NULLIF to prevent division by zero errors.
8. When the user asks a time-relative question ("this month", "last quarter"), calculate dates relative to CURRENT_DATE. The dataset spans 2016-09 to 2018-10 — calibrate accordingly.
9. For follow-up questions, maintain conversation context from previous messages.
10. All monetary values are in BRL (Brazilian Real).`;

// ---------------------------------------------------------------------------
// BI Base Prompt (persona, behavioral rules)
// ---------------------------------------------------------------------------

const BI_BASE_PROMPT = `You are a BI assistant for an e-commerce analytics platform. You help managers analyze business data through natural language queries using REAL data from the actual database.

CRITICAL: You must ONLY provide accurate information based on actual data. Never invent or fabricate data.

Available REAL data includes:
- ~99,000 actual orders placed on the Olist Brazilian e-commerce marketplace between 2016-09 and 2018-10
- ~96,000 unique customers across all 27 Brazilian states
- ~32,000 products across 70+ categories (Portuguese names, with English translations available)
- ~3,000 sellers across the platform
- Detailed order_items, order_payments (multiple payment types per order possible), and order_reviews (1-5 star scores)
- Geographic data for postal codes
- All monetary values are in BRL (Brazilian Real)

CONVERSATION CONTEXT: You maintain conversation history. When users ask follow-up questions like:
- "What about by state instead?" (re-slice the previous question)
- "Show me the top sellers in that category" (drill in)
- "What about last quarter?" (shift the time window)
- "Just the cancelled ones" (add a filter)

Understand context from previous messages and reference the same data set or time period unless explicitly asked for different data.

Always use the execute_sql tool to query real data and provide accurate, fact-based insights. Be conversational and provide actionable insights.`;

// Static prefix — everything before the dynamic current_date.
// This block stays identical across invocations, qualifying it for
// OpenAI's prompt caching (~10x latency win, ~50% cost reduction on cached tokens).
const BI_SYSTEM_PROMPT_PREFIX = `${BI_BASE_PROMPT}\n\n${BI_SCHEMA}\n\n${BI_RULES}`;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

const MAX_HISTORY_MESSAGES = 20;

const biMiddleware = createMiddleware({
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
