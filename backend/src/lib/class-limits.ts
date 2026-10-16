import { positiveIntFromEnv } from './env-int.js';

/** Custom Classes one account may hold (archived included, versions not), read once at module load. */
export const CUSTOM_CLASS_MAX_PER_GM = positiveIntFromEnv('CUSTOM_CLASS_MAX_PER_GM', 50);
export const CUSTOM_CLASS_DAILY_PUBLISH_LIMIT = positiveIntFromEnv('CUSTOM_CLASS_DAILY_PUBLISH_LIMIT', 5);
