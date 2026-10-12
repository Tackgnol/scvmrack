/**
 * Multiplier applied to every per-visitor rate limit, from RATE_LIMIT_SCALE (default 1).
 * Environments that replay many requests from one address (e2e, integration) raise it in their config.
 */
export function rateLimitScale(raw = process.env.RATE_LIMIT_SCALE): number {
  if (raw === undefined || raw.trim() === '') return 1;
  const scale = Number(raw);
  if (!Number.isFinite(scale) || scale < 1) {
    throw new Error(`RATE_LIMIT_SCALE must be a number >= 1, got "${raw}"`);
  }
  return scale;
}

const scale = rateLimitScale();

/** A route's request cap per visitor and window, after RATE_LIMIT_SCALE. */
export function limitMax(max: number): number {
  return Math.ceil(max * scale);
}
