// BI Few-Shot SQL Examples — Olist e-commerce
//
// do not refactor to top-level await — it changes the cold-start contract;
// the empty-string fallback in wrapModelCall is intentional.
//
// The corpus and the template always change together. One file.
// Every example uses $TENANT_ID, which the execute_sql tool requires as
// proof of tenant-isolation acknowledgement.

import { FewShotPromptTemplate, PromptTemplate } from "@langchain/core/prompts";

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
export let formattedExamples = "";
fewShotTemplate.format({}).then((s) => (formattedExamples = s));
