/**
 * In-memory, fixed-window rate limiter for login attempts.
 *
 * This is intentionally simple: a single Node process keeps a Map keyed by
 * `scope:identifier` (e.g. the client IP, or IP+email) and counts attempts
 * within a rolling window. It resets on process restart and is NOT shared
 * across multiple server instances — if this app is ever horizontally
 * scaled, replace this with a shared store (Redis, DB-backed counter, etc).
 * For a single-instance deployment it is sufficient to blunt credential
 * stuffing / brute force without adding an infrastructure dependency.
 */

interface Bucket {
	count: number;
	windowStartedAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically forget stale buckets so this Map can't grow unbounded.
const SWEEP_INTERVAL_MS = 1000 * 60 * 10;
let lastSweep = Date.now();

function sweep(maxWindowMs: number) {
	const now = Date.now();
	if (now - lastSweep < SWEEP_INTERVAL_MS) return;
	lastSweep = now;
	for (const [key, bucket] of buckets) {
		if (now - bucket.windowStartedAt > maxWindowMs) {
			buckets.delete(key);
		}
	}
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	retryAfterMs: number;
}

export interface RateLimitOptions {
	/** Max attempts allowed within the window. */
	limit: number;
	/** Window size in milliseconds. */
	windowMs: number;
}

/**
 * Checks and records an attempt for `key`. Call this once per attempt
 * (e.g. once per login POST), not once per "did it succeed" check.
 */
export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
	sweep(opts.windowMs);

	const now = Date.now();
	const existing = buckets.get(key);

	if (!existing || now - existing.windowStartedAt >= opts.windowMs) {
		buckets.set(key, { count: 1, windowStartedAt: now });
		return { allowed: true, remaining: opts.limit - 1, retryAfterMs: 0 };
	}

	if (existing.count >= opts.limit) {
		const retryAfterMs = opts.windowMs - (now - existing.windowStartedAt);
		return { allowed: false, remaining: 0, retryAfterMs };
	}

	existing.count += 1;
	return { allowed: true, remaining: opts.limit - existing.count, retryAfterMs: 0 };
}

/** Clears an identifier's bucket, e.g. after a successful login. */
export function resetRateLimit(key: string): void {
	buckets.delete(key);
}

export const LOGIN_RATE_LIMIT: RateLimitOptions = { limit: 10, windowMs: 1000 * 60 * 15 };
export const PASSWORD_RESET_RATE_LIMIT: RateLimitOptions = { limit: 5, windowMs: 1000 * 60 * 15 };
