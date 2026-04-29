// Database schema — Olist Brazilian E-commerce dataset + agent persistence.
//
// Every analytical table carries `tenant_id` even though the demo runs as a
// single fixed tenant (id = 1). This preserves the tenant-isolation security
// model from the source repo verbatim: the agent's execute_sql tool requires
// `WHERE tenant_id = $TENANT_ID` in every query and the server replaces the
// placeholder with the configured tenant id.

import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  numeric,
  jsonb,
  doublePrecision,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Analytical tables (Olist)
// ---------------------------------------------------------------------------

export const orders = pgTable("orders", {
  orderId: text("order_id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.customerId),
  orderStatus: text("order_status").notNull(),
  orderPurchaseTimestamp: timestamp("order_purchase_timestamp"),
  orderApprovedAt: timestamp("order_approved_at"),
  orderDeliveredCarrierDate: timestamp("order_delivered_carrier_date"),
  orderDeliveredCustomerDate: timestamp("order_delivered_customer_date"),
  orderEstimatedDeliveryDate: timestamp("order_estimated_delivery_date"),
});

export const orderItems = pgTable("order_items", {
  orderId: text("order_id")
    .notNull()
    .references(() => orders.orderId),
  orderItemId: integer("order_item_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  productId: text("product_id")
    .notNull()
    .references(() => products.productId),
  sellerId: text("seller_id")
    .notNull()
    .references(() => sellers.sellerId),
  shippingLimitDate: timestamp("shipping_limit_date"),
  price: numeric("price", { precision: 12, scale: 2 }),
  freightValue: numeric("freight_value", { precision: 12, scale: 2 }),
});

export const orderPayments = pgTable("order_payments", {
  orderId: text("order_id")
    .notNull()
    .references(() => orders.orderId),
  paymentSequential: integer("payment_sequential").notNull(),
  tenantId: integer("tenant_id").notNull(),
  paymentType: text("payment_type").notNull(),
  paymentInstallments: integer("payment_installments"),
  paymentValue: numeric("payment_value", { precision: 12, scale: 2 }),
});

export const orderReviews = pgTable("order_reviews", {
  reviewId: text("review_id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.orderId),
  tenantId: integer("tenant_id").notNull(),
  reviewScore: integer("review_score"),
  reviewCommentTitle: text("review_comment_title"),
  reviewCommentMessage: text("review_comment_message"),
  reviewCreationDate: timestamp("review_creation_date"),
  reviewAnswerTimestamp: timestamp("review_answer_timestamp"),
});

export const products = pgTable("products", {
  productId: text("product_id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  // No FK to product_category_translation: 610 products have NULL category and
  // 13 reference 2 categories ('pc_gamer', 'portateis_cozinha_e_preparadores_
  // _de_alimentos') absent from the upstream translation table. The agent
  // joins via LEFT JOIN + COALESCE — see the system prompt's Relationships
  // section.
  productCategoryName: text("product_category_name"),
  productNameLength: integer("product_name_length"),
  productDescriptionLength: integer("product_description_length"),
  productPhotosQty: integer("product_photos_qty"),
  productWeightG: integer("product_weight_g"),
  productLengthCm: integer("product_length_cm"),
  productHeightCm: integer("product_height_cm"),
  productWidthCm: integer("product_width_cm"),
});

export const productCategoryTranslation = pgTable(
  "product_category_translation",
  {
    productCategoryName: text("product_category_name").primaryKey(),
    tenantId: integer("tenant_id").notNull(),
    productCategoryNameEnglish: text("product_category_name_english").notNull(),
  },
);

export const customers = pgTable("customers", {
  customerId: text("customer_id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  customerUniqueId: text("customer_unique_id").notNull(),
  customerZipCodePrefix: text("customer_zip_code_prefix"),
  customerCity: text("customer_city"),
  customerState: text("customer_state"),
});

export const sellers = pgTable("sellers", {
  sellerId: text("seller_id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  sellerZipCodePrefix: text("seller_zip_code_prefix"),
  sellerCity: text("seller_city"),
  sellerState: text("seller_state"),
});

export const geolocation = pgTable("geolocation", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  geolocationZipCodePrefix: text("geolocation_zip_code_prefix").notNull(),
  geolocationLat: doublePrecision("geolocation_lat"),
  geolocationLng: doublePrecision("geolocation_lng"),
  geolocationCity: text("geolocation_city"),
  geolocationState: text("geolocation_state"),
});

// ---------------------------------------------------------------------------
// Agent persistence (lifted verbatim from source repo)
// ---------------------------------------------------------------------------

export const agentSessions = pgTable("agent_sessions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  archived: integer("archived").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agentMessages = pgTable("agent_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  query: text("query"),
  data: jsonb("data"),
  // Chart config the agent emitted alongside the answer. Persisting it lets
  // the chart re-render when the session is rehydrated (otherwise the chart
  // would vanish as soon as the local state is replaced by DB rows — first
  // visible after sending the first message in a fresh session).
  chartConfig: jsonb("chart_config"),
  followUpQuestions: jsonb("follow_up_questions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentFeedback = pgTable("agent_feedback", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  sessionId: integer("session_id").notNull(),
  messageId: integer("message_id"),
  userId: text("user_id").notNull(),
  rating: text("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});
