const MAX_FAILURES = 5;
const LOCKOUT_SECONDS = [60, 300, 900, 3600]; // 1m, 5m, 15m, 1h progressive

interface LockoutRecord {
  count: number;
  lockedUntil: number;
}

export const loginAttempts = new Map<string, LockoutRecord>();

export function getLockedUntil(emailHash: string): number | null {
  const record = loginAttempts.get(emailHash);
  if (!record || record.lockedUntil <= Date.now()) return null;
  return record.lockedUntil;
}

export function recordLoginFailure(emailHash: string): void {
  const record = loginAttempts.get(emailHash) || {
    count: 0,
    lockedUntil: 0,
  };
  record.count++;
  if (record.count >= MAX_FAILURES) {
    const tier = Math.min(
      Math.floor((record.count - MAX_FAILURES) / MAX_FAILURES),
      LOCKOUT_SECONDS.length - 1
    );
    record.lockedUntil = Date.now() + LOCKOUT_SECONDS[tier] * 1000;
  }
  loginAttempts.set(emailHash, record);
}

export function clearLoginFailures(emailHash: string): void {
  loginAttempts.delete(emailHash);
}

// Purge stale entries every 10 minutes.
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginAttempts) {
    if (val.lockedUntil < now && now - val.lockedUntil > 3_600_000) {
      loginAttempts.delete(key);
    }
  }
}, 600_000);
cleanupInterval.unref();
