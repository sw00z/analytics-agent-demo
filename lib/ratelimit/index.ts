// Per-IP rate limiter for the public demo.
//
// Production (Vercel): @upstash/ratelimit sliding window, durable across
// instances. Single Lua-evaluated round-trip per check, with an in-process
// ephemeralCache so repeated calls from the same IP within one Node process
// skip Redis entirely.
//
// Local dev: in-memory Map. Per-instance, resets on cold start — fine for
// `pnpm dev`, NOT a real cost guardrail in prod.
//
// The OpenAI dashboard's monthly spend cap is the actual safety net;
// this limiter is convenience to slow down honest abusers.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const LIMIT = Number(process.env.RATE_LIMIT_PER_HOUR ?? "35");

const redisLimiter =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(LIMIT, "1 h"),
        analytics: true,
        prefix: "rl",
        ephemeralCache: new Map(),
      })
    : null;

const memoryStore = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

export async function rateLimit(ip: string): Promise<RateLimitResult> {
  if (redisLimiter) {
    const r = await redisLimiter.limit(ip);
    return {
      allowed: r.success,
      remaining: r.remaining,
      resetAt: new Date(r.reset),
      limit: r.limit,
    };
  }

  // In-memory fallback: sliding window over an array of timestamps.
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const timestamps = memoryStore.get(ip) ?? [];
  const recent = timestamps.filter((t) => t > cutoff);

  if (recent.length >= LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(recent[0] + WINDOW_MS),
      limit: LIMIT,
    };
  }

  recent.push(now);
  memoryStore.set(ip, recent);

  return {
    allowed: true,
    remaining: LIMIT - recent.length,
    resetAt: new Date(now + WINDOW_MS),
    limit: LIMIT,
  };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt.getTime() / 1000)),
    ...(result.allowed
      ? {}
      : {
          "Retry-After": String(
            Math.max(
              1,
              Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
            ),
          ),
        }),
  };
}
