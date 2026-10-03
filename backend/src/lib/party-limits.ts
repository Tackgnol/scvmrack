import { positiveIntFromEnv } from './env-int.js';

/** Party member cap, read once at module load from PARTY_MAX_MEMBERS. */
export const PARTY_MAX_MEMBERS = positiveIntFromEnv('PARTY_MAX_MEMBERS', 10);
