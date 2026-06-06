import validator from 'validator';
import { isSupportedLocale, type SupportedLocale } from './config/locales.js';

/**
 * Convert a camelCase string to snake_case
 */
export function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Convert a snake_case string to camelCase
 */
export function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// Bounds recursive traversal. Character JSONB shape is at most ~4 levels deep
// (character → equipment[] → modifiers[] → primitives); 8 leaves headroom while
// rejecting adversarially-nested payloads that slip past JSON-schema limits.
const MAX_TRANSFORM_DEPTH = 8;

/**
 * Recursively transform all object keys using the given function.
 * Arrays are traversed, primitives are left as-is. Bounded depth.
 */
export function transformKeys(obj: unknown, keyFn: (key: string) => string, depth = 0): unknown {
  if (depth >= MAX_TRANSFORM_DEPTH) return obj;
  if (Array.isArray(obj)) return obj.map((item) => transformKeys(item, keyFn, depth + 1));
  if (obj !== null && typeof obj === 'object') {
    const prototype = Object.getPrototypeOf(obj);
    if (prototype !== Object.prototype && prototype !== null) {
      return obj;
    }
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [keyFn(k), transformKeys(v, keyFn, depth + 1)])
    );
  }
  return obj;
}

/**
 * Sanitize a string input - escape HTML, trim, limit length
 */
export function sanitizeString(input: unknown, maxLength = 10000): string {
  if (typeof input !== 'string') return '';

  return validator.escape(validator.trim(input)).slice(0, maxLength);
}

/**
 * Sanitize JSONB objects recursively
 */
export function sanitizeJsonb(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeJsonb(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize the key too (prevent prototype pollution)
      const safeKey = validator.escape(key);
      if (
        safeKey === '__proto__' ||
        safeKey === 'constructor' ||
        safeKey === 'prototype'
      ) {
        continue; // Skip dangerous keys
      }

      if (typeof value === 'string') {
        result[safeKey] = sanitizeString(value);
      } else if (typeof value === 'boolean') {
        result[safeKey] = value;
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        result[safeKey] = value;
      } else if (value === null) {
        result[safeKey] = null;
      } else if (Array.isArray(value) || typeof value === 'object') {
        result[safeKey] = sanitizeJsonb(value);
      }
      // Skip functions and undefined
    }
    return result;
  }

  return obj;
}

/**
 * Sanitize character update payload
 */
export function sanitizeCharacterUpdate(
  updates: Record<string, unknown>
): Record<string, unknown> {
  // Server-side backstop limits. These must never exceed the DB column size:
  // `name` and `origin` are VarChar(255); the rest are text columns. The
  // stricter, user-facing limits live in the frontend
  // (`frontend/src/validation/characterUpdate.ts`); unifying both into one
  // shared module is tracked with the Repository/Service refactor.
  const stringFields: Record<string, number> = {
    name: 255,
    habit: 1000,
    tale: 1000,
    trait1: 255,
    trait2: 255,
    bodyDescription: 1000,
    origin: 255, // VarChar(255) column — must not exceed 255 or the insert throws
    notes: 10000,
  };

  // Integer fields with min/max bounds
  const integerFields: Record<string, { min: number; max: number }> = {
    currentHp: { min: -100, max: 1000 },
    maxHp: { min: 1, max: 1000 },
    omens: { min: 0, max: 100 },
    maxOmens: { min: 0, max: 100 },
    silver: { min: 0, max: 1000000 },
    strength: { min: 1, max: 30 },
    agility: { min: 1, max: 30 },
    presence: { min: 1, max: 30 },
    toughness: { min: 1, max: 30 },
  };

  // JSONB fields
  const jsonbFields = [
    'abilities',
    'equipment',
    'storage',
    'equippedWeapons',
    'equippedArmor',
    'modifiers',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    // Skip dangerous keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    if (key in stringFields && typeof value === 'string') {
      sanitized[key] = sanitizeString(value, stringFields[key]);
    } else if (key in integerFields && typeof value === 'number') {
      const bounds = integerFields[key];
      if (Number.isFinite(value)) {
        sanitized[key] = Math.max(
          bounds.min,
          Math.min(bounds.max, Math.floor(value))
        );
      }
    } else if (jsonbFields.includes(key)) {
      sanitized[key] = sanitizeJsonb(value);
    }
    // Unknown fields are silently dropped
  }

  return sanitized;
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  return validator.isUUID(id, 4);
}

/**
 * Mörk Borg stat → modifier table (≤4→-3 … 17+→+3)
 */
export function rollToModifier(roll: number): number {
  if (roll <= 4) return -3;
  if (roll <= 6) return -2;
  if (roll <= 8) return -1;
  if (roll <= 12) return 0;
  if (roll <= 14) return 1;
  if (roll <= 16) return 2;
  return 3;
}

/**
 * Validate locale
 */
export function isValidLocale(locale: unknown): locale is SupportedLocale {
  return isSupportedLocale(locale);
}

/**
 * Convert a sanitized camelCase patch to snake_case keys for the DB update_character function.
 * JSONB content (arrays/objects) is also converted so stored data stays in snake_case.
 */
export function toDbPatch(patch: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(patch).map(([k, v]) => [
      camelToSnake(k),
      (Array.isArray(v) || (v !== null && typeof v === 'object'))
        ? transformKeys(v, camelToSnake)
        : v,
    ])
  );
}

/**
 * Transform a character response from Postgres to camelCase recursively.
 * This normalizes both top-level columns and nested JSONB content.
 */
export function camelCaseJsonbFields<T extends object>(row: T): T {
  return transformKeys(row, snakeToCamel) as T;
}
