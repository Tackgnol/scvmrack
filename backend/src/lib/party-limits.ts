const DEFAULT_PARTY_MAX_MEMBERS = 10;

/** Party member cap, read once at module load from PARTY_MAX_MEMBERS and clamped to a positive integer. */
export const PARTY_MAX_MEMBERS = (() => {
  const raw = process.env.PARTY_MAX_MEMBERS;
  if (!raw) {
    return DEFAULT_PARTY_MAX_MEMBERS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_PARTY_MAX_MEMBERS;
  }
  return parsed;
})();
