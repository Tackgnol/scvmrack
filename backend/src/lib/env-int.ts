/** A positive integer from env var `name`, read once by the caller; `fallback` when unset or invalid. */
export function positiveIntFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
}
