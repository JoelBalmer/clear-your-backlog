import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory rate limiter, keyed per (route, ip). State is per-instance, so it
// resets on cold start — fine for blocking dumb floods. Not a real WAF.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function ip(req: VercelRequest): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  if (Array.isArray(xff) && xff.length > 0) return xff[0];
  return (req.headers['x-real-ip'] as string) ?? 'unknown';
}

export type RateLimitConfig = {
  route: string;
  windowMs: number;
  max: number;
};

export function checkRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  cfg: RateLimitConfig,
): boolean {
  const key = `${cfg.route}:${ip(req)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + cfg.windowMs });
    return true;
  }

  if (bucket.count >= cfg.max) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({
      error: 'rate_limited',
      message: `Too many requests. Try again in ${retryAfter}s.`,
    });
    return false;
  }

  bucket.count += 1;
  return true;
}
