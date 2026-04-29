// Per-IP rate limiter for the public demo.
//
// Production (Vercel): @upstash/redis sorted set, durable across instances.
// Local dev: in-memory Map. Per-instance, resets on cold start — fine for
// `pnpm dev`, NOT a real cost guardrail in prod.
//
// The OpenAI dashboard's monthly spend cap is the actual safety net;
// this limiter is convenience to slow down honest abusers.

import { Redis } from "@upstash/redis";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const LIMIT = Number(process.env.RATE_LIMIT_PER_HOUR ?? "35");

let redis: Redis | null = null;
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const memoryStore = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

export async function rateLimit(ip: string): Promise<RateLimitResult> {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const key = `rl:${ip}`;

  if (redis) {
    // Sorted set scored by timestamp.
    await redis.zremrangebyscore(key, 0, cutoff);
    const count = (await redis.zcard(key)) ?? 0;

    if (count >= LIMIT) {
      const oldestEntries = (await redis.zrange(key, 0, 0, {
        withScores: true,
      })) as [string, number] | string[];
      const oldestScore = Array.isArray(oldestEntries)
        ? typeof oldestEntries[1] === "number"
          ? oldestEntries[1]
          : now
        : now;
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(oldestScore + WINDOW_MS),
        limit: LIMIT,
      };
    }

    await redis.zadd(key, {
      score: now,
      member: `${now}-${Math.random().toString(36).slice(2)}`,
    });
    await redis.expire(key, Math.ceil(WINDOW_MS / 1000));

    return {
      allowed: true,
      remaining: LIMIT - count - 1,
      resetAt: new Date(now + WINDOW_MS),
      limit: LIMIT,
    };
  }

  // In-memory fallback
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
