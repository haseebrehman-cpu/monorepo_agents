import type { NextFunction, Request, Response } from "express";

type AttemptEntry = {
  count: number;
  resetAt: number;
};

export type AttemptLimiterOptions = {
  windowMs: number;
  maxAttempts: number;
  /** Upper bound on tracked keys so a flood of unique keys cannot exhaust memory. */
  maxKeys?: number;
};

export function createAttemptLimiter({
  windowMs,
  maxAttempts,
  maxKeys = 10_000,
}: AttemptLimiterOptions) {
  const entries = new Map<string, AttemptEntry>();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of entries) {
      if (entry.resetAt <= now) entries.delete(key);
    }
  }, windowMs);
  sweep.unref();

  function current(key: string) {
    const entry = entries.get(key);
    if (!entry) return null;
    if (entry.resetAt <= Date.now()) {
      entries.delete(key);
      return null;
    }
    return entry;
  }

  return {
    retryAfterSeconds(key: string): number {
      const entry = current(key);
      if (!entry || entry.count < maxAttempts) return 0;
      return Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000));
    },

    recordFailure(key: string) {
      const entry = current(key);
      if (entry) {
        entry.count += 1;
        return;
      }
      while (entries.size >= maxKeys) {
        const oldest = entries.keys().next().value;
        if (oldest === undefined) break;
        entries.delete(oldest);
      }
      entries.set(key, { count: 1, resetAt: Date.now() + windowMs });
    },

    reset(key: string) {
      entries.delete(key);
    },
  };
}

/** Fixed-window request limit per key. State is per process. */
export function rateLimit({
  windowMs,
  maxRequests,
  key,
  error = "TOO_MANY_REQUESTS",
}: {
  windowMs: number;
  maxRequests: number;
  key: (req: Request) => string;
  error?: string;
}) {
  const limiter = createAttemptLimiter({ windowMs, maxAttempts: maxRequests });
  return (req: Request, res: Response, next: NextFunction) => {
    const limiterKey = key(req);
    const retryAfter = limiter.retryAfterSeconds(limiterKey);
    if (retryAfter > 0) {
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ success: false, error });
    }
    limiter.recordFailure(limiterKey);
    next();
  };
}
