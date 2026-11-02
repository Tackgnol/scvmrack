import { z } from 'zod';

export const PARTY_NAME_MAX_LENGTH = 100;
export const partyNameSchema = z.string().max(PARTY_NAME_MAX_LENGTH).trim();
