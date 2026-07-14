/**
 * Simple in-memory rate limiter.
 * Works per serverless function instance — adequate for basic abuse prevention.
 * For stronger guarantees, replace with a Redis/Vercel KV-backed implementation.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically (every 5 min)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * Check whether `key` is within the allowed rate.
 *
 * @param key      Unique identifier (e.g. IP + endpoint)
 * @param limit    Max requests per window
 * @param windowMs Window size in milliseconds (default: 60 000 = 1 min)
 * @returns `{ allowed: true }` or `{ allowed: false, retryAfterMs: number }`
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true }
}
