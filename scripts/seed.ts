// Olist seed pipeline.
//
// Reads CSVs from seed/raw/ and bulk-inserts them into the configured Postgres
// (DATABASE_URL). Every row is stamped with tenant_id = DEMO_TENANT_ID so the
// agent's tenant-isolation guardrail flows end-to-end.
//
// Order matters: parents before children, otherwise FK joins on the analytical
// queries return empty results. We deliberately do NOT enforce FKs at the DB
// level — the dataset has dangling references in places, and the agent's
// queries handle those gracefully with LEFT JOINs.
//
// Re-runnable: TRUNCATEs each table before inserting.

import "dotenv/config";
import { readFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getTableName, sql } from "drizzle-orm";
import {
  orders,
  orderItems,
  orderPayments,
  orderReviews,
  products,
  productCategoryTranslation,
  customers,
  sellers,
  geolocation,
} from "../lib/db/schema";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env or .env.local.");
  process.exit(1);
}

const TENANT_ID = Number(process.env.DEMO_TENANT_ID ?? "1");
const RAW_DIR = resolve(process.cwd(), "seed/raw");
const BATCH_SIZE = 1000;

const dbClient = drizzle(neon(process.env.DATABASE_URL));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readCsv(filename: string): Promise<Record<string, string>[]> {
  const path = join(RAW_DIR, filename);
  try {
    await access(path);
  } catch {
    console.error(`Missing file: ${path}`);
    console.error(
      `Download archive.zip from https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce ` +
        `and extract the CSVs into seed/raw/`,
    );
    process.exit(1);
  }
  const buf = await readFile(path);
  return parse(buf, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Record<string, string>[];
}

function nullable(v: string | undefined): string | null {
  if (v === undefined) return null;
  const trimmed = v.trim();
  return trimmed === "" || trimmed === "NaN" ? null : trimmed;
}

function asInt(v: string | undefined): number | null {
  const n = nullable(v);
  if (n === null) return null;
  const parsed = parseInt(n, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function asFloat(v: string | undefined): number | null {
  const n = nullable(v);
  if (n === null) return null;
  const parsed = parseFloat(n);
  return Number.isFinite(parsed) ? parsed : null;
}

function asTimestamp(v: string | undefined): Date | null {
  const n = nullable(v);
  if (n === null) return null;
  const d = new Date(n.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

// PostgreSQL strips trailing whitespace on numeric strings, so we keep prices
// as strings (drizzle-orm numeric column accepts string).
function asNumeric(v: string | undefined): string | null {
  const n = nullable(v);
  if (n === null) return null;
  const parsed = parseFloat(n);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : null;
}

async function batchInsert<T extends Record<string, unknown>>(
  table: Parameters<typeof getTableName>[0],
  rows: T[],
  insertFn: (batch: T[]) => Promise<unknown>,
) {
  const tableName = getTableName(table);
  console.log(`  Inserting ${rows.length} rows into ${tableName}...`);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await insertFn(batch);
    if ((i / BATCH_SIZE) % 10 === 0) {
      process.stdout.write(`    ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}\r`);
    }
  }
  console.log(`    ${rows.length}/${rows.length} done`);
}

async function truncate(name: string) {
  await dbClient.execute(sql.raw(`TRUNCATE TABLE ${name} RESTART IDENTITY CASCADE`));
}

// ---------------------------------------------------------------------------
// Per-table loaders
// ---------------------------------------------------------------------------

async function loadCustomers() {
  const rows = await readCsv("olist_customers_dataset.csv");
  await truncate("customers");
  const mapped = rows.map((r) => ({
    customerId: r.customer_id,
    tenantId: TENANT_ID,
    customerUniqueId: r.customer_unique_id,
    customerZipCodePrefix: nullable(r.customer_zip_code_prefix),
    customerCity: nullable(r.customer_city),
    customerState: nullable(r.customer_state),
  }));
  await batchInsert(customers, mapped, (b) =>
    dbClient.insert(customers).values(b).onConflictDoNothing(),
  );
}

async function loadSellers() {
  const rows = await readCsv("olist_sellers_dataset.csv");
  await truncate("sellers");
  const mapped = rows.map((r) => ({
    sellerId: r.seller_id,
    tenantId: TENANT_ID,
    sellerZipCodePrefix: nullable(r.seller_zip_code_prefix),
    sellerCity: nullable(r.seller_city),
    sellerState: nullable(r.seller_state),
  }));
  await batchInsert(sellers, mapped, (b) =>
    dbClient.insert(sellers).values(b).onConflictDoNothing(),
  );
}

async function loadGeolocation() {
  const rows = await readCsv("olist_geolocation_dataset.csv");
  await truncate("geolocation");
  // Geolocation has duplicates per zip prefix; we keep them all for mapping.
  const mapped = rows.map((r) => ({
    tenantId: TENANT_ID,
    geolocationZipCodePrefix: r.geolocation_zip_code_prefix,
    geolocationLat: asFloat(r.geolocation_lat),
    geolocationLng: asFloat(r.geolocation_lng),
    geolocationCity: nullable(r.geolocation_city),
    geolocationState: nullable(r.geolocation_state),
  }));
  await batchInsert(geolocation, mapped, (b) =>
    dbClient.insert(geolocation).values(b),
  );
}

async function loadCategoryTranslation() {
  const rows = await readCsv("product_category_name_translation.csv");
  await truncate("product_category_translation");
  const mapped = rows.map((r) => ({
    productCategoryName: r.product_category_name,
    tenantId: TENANT_ID,
    productCategoryNameEnglish: r.product_category_name_english,
  }));
  await batchInsert(productCategoryTranslation, mapped, (b) =>
    dbClient.insert(productCategoryTranslation).values(b).onConflictDoNothing(),
  );
}

async function loadProducts() {
  const rows = await readCsv("olist_products_dataset.csv");
  await truncate("products");
  const mapped = rows.map((r) => ({
    productId: r.product_id,
    tenantId: TENANT_ID,
    productCategoryName: nullable(r.product_category_name),
    productNameLength: asInt(r.product_name_lenght), // typo in upstream CSV
    productDescriptionLength: asInt(r.product_description_lenght),
    productPhotosQty: asInt(r.product_photos_qty),
    productWeightG: asInt(r.product_weight_g),
    productLengthCm: asInt(r.product_length_cm),
    productHeightCm: asInt(r.product_height_cm),
    productWidthCm: asInt(r.product_width_cm),
  }));
  await batchInsert(products, mapped, (b) =>
    dbClient.insert(products).values(b).onConflictDoNothing(),
  );
}

async function loadOrders() {
  const rows = await readCsv("olist_orders_dataset.csv");
  await truncate("orders");
  const mapped = rows.map((r) => ({
    orderId: r.order_id,
    tenantId: TENANT_ID,
    customerId: r.customer_id,
    orderStatus: r.order_status,
    orderPurchaseTimestamp: asTimestamp(r.order_purchase_timestamp),
    orderApprovedAt: asTimestamp(r.order_approved_at),
    orderDeliveredCarrierDate: asTimestamp(r.order_delivered_carrier_date),
    orderDeliveredCustomerDate: asTimestamp(r.order_delivered_customer_date),
    orderEstimatedDeliveryDate: asTimestamp(r.order_estimated_delivery_date),
  }));
  await batchInsert(orders, mapped, (b) =>
    dbClient.insert(orders).values(b).onConflictDoNothing(),
  );
}

async function loadOrderItems() {
  const rows = await readCsv("olist_order_items_dataset.csv");
  await truncate("order_items");
  const mapped = rows.map((r) => ({
    orderId: r.order_id,
    orderItemId: asInt(r.order_item_id) ?? 0,
    tenantId: TENANT_ID,
    productId: r.product_id,
    sellerId: r.seller_id,
    shippingLimitDate: asTimestamp(r.shipping_limit_date),
    price: asNumeric(r.price),
    freightValue: asNumeric(r.freight_value),
  }));
  await batchInsert(orderItems, mapped, (b) =>
    dbClient.insert(orderItems).values(b),
  );
}

async function loadOrderPayments() {
  const rows = await readCsv("olist_order_payments_dataset.csv");
  await truncate("order_payments");
  const mapped = rows.map((r) => ({
    orderId: r.order_id,
    paymentSequential: asInt(r.payment_sequential) ?? 1,
    tenantId: TENANT_ID,
    paymentType: r.payment_type,
    paymentInstallments: asInt(r.payment_installments),
    paymentValue: asNumeric(r.payment_value),
  }));
  await batchInsert(orderPayments, mapped, (b) =>
    dbClient.insert(orderPayments).values(b),
  );
}

async function loadOrderReviews() {
  const rows = await readCsv("olist_order_reviews_dataset.csv");
  await truncate("order_reviews");
  // Reviews have duplicate review_ids in the raw data; dedupe by keeping last.
  const seen = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    if (r.review_id) seen.set(r.review_id, r);
  }
  const mapped = Array.from(seen.values()).map((r) => ({
    reviewId: r.review_id,
    orderId: r.order_id,
    tenantId: TENANT_ID,
    reviewScore: asInt(r.review_score),
    reviewCommentTitle: nullable(r.review_comment_title),
    reviewCommentMessage: nullable(r.review_comment_message),
    reviewCreationDate: asTimestamp(r.review_creation_date),
    reviewAnswerTimestamp: asTimestamp(r.review_answer_timestamp),
  }));
  await batchInsert(orderReviews, mapped, (b) =>
    dbClient.insert(orderReviews).values(b).onConflictDoNothing(),
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Seeding from ${RAW_DIR} with tenant_id=${TENANT_ID}`);
  console.log("");

  console.log("1/9 customers");
  await loadCustomers();
  console.log("2/9 sellers");
  await loadSellers();
  console.log("3/9 geolocation");
  await loadGeolocation();
  console.log("4/9 product_category_translation");
  await loadCategoryTranslation();
  console.log("5/9 products");
  await loadProducts();
  console.log("6/9 orders");
  await loadOrders();
  console.log("7/9 order_items");
  await loadOrderItems();
  console.log("8/9 order_payments");
  await loadOrderPayments();
  console.log("9/9 order_reviews");
  await loadOrderReviews();

  console.log("");
  console.log("Done. Run `pnpm dev` and visit http://localhost:3000/chat");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
