/** Whole days until the server deletes an untouched draft. */
export function expiryDays(expiresAt: string, now = Date.now()) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 86_400_000));
}
