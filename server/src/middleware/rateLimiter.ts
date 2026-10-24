import { Request, Response, NextFunction } from 'express';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

interface RateLimiterOptions {
  windowMs: number;
  maxTokens: number;
  message?: string;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxTokens, message = 'Rate limit exceeded: Tactical throttle engaged.' } = options;
  const refillRate = maxTokens / windowMs; // tokens per ms

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || 'unknown-client';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { tokens: maxTokens, lastRefill: now };
      buckets.set(key, bucket);
    } else {
      const elapsed = now - bucket.lastRefill;
      bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillRate);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      res.setHeader('X-RateLimit-Limit', maxTokens.toString());
      res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens).toString());
      next();
    } else {
      const retryAfterSeconds = Math.ceil((1 - bucket.tokens) / refillRate / 1000);
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      res.status(429).json({
        success: false,
        error: '[THROTTLE_ENGAGED]',
        message: `${message} Max ${maxTokens} submissions per minute permitted under Cold Steel security protocol.`,
        retryAfterSeconds,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

// Strict rate limiter for code/form submissions (max 5 requests per minute)
export const submissionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxTokens: 5,
  message: 'SECURITY ALERT: Submission burst limit reached.',
});

// Standard limiter for status polling
export const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxTokens: 120,
  message: 'Telemetry polling rate limit reached.',
});
