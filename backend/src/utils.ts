import validator from 'validator';
import { isSupportedLocale, type SupportedLocale } from './config/locales.js';
import { CHARACTER_INTEGER_BOUNDS, CHARACTER_TEXT_BOUNDS } from './lib/character-limits.js';

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
function transformKeys(obj: unknown, keyFn: (key: string) => string, depth = 0): unknown {
  if (depth >= MAX_TRANSFORM_DEPTH) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item, keyFn, depth + 1));
  }
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
 * Sanitize a string input as plain text data: trim and limit length.
 * HTML escaping belongs at render boundaries, not in persisted API values.
 */
export function sanitizeString(input: unknown, maxLength = 10000): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input.trim().slice(0, maxLength);
}

/**
 * Sanitize JSONB objects recursively while preserving user text as plain text.
 */
export function sanitizeJsonb(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeJsonb(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (
        key === '__proto__' ||
        key === 'constructor' ||
        key === 'prototype'
      ) {
        continue; // Skip dangerous keys
      }

      if (typeof value === 'string') {
        result[key] = sanitizeString(value);
      } else if (typeof value === 'boolean') {
        result[key] = value;
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        result[key] = value;
      } else if (value === null) {
        result[key] = null;
      } else if (Array.isArray(value) || typeof value === 'object') {
        result[key] = sanitizeJsonb(value);
      }
      // Skip functions and undefined
    }
    return result;
  }

  return obj;
}

/** False for the keyless, nameless entries an empty armor slot once left behind in inventory; non-objects pass through to `sanitizeJsonb`. */
export function isNamedItem(item: unknown): boolean {
  if (!item || typeof item !== 'object') {
    return true;
  }
  const { key, name } = item as { key?: unknown; name?: unknown };
  return Boolean(key) || (typeof name === 'string' && name.trim() !== '');
}

/**
 * Sanitize character update payload
 */
export function sanitizeCharacterUpdate(
  updates: Record<string, unknown>
): Record<string, unknown> {
  const stringFields: Record<string, { storedLength: number }> = CHARACTER_TEXT_BOUNDS;
  const integerFields: Record<string, { min: number; max: number }> = CHARACTER_INTEGER_BOUNDS;

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
      sanitized[key] = sanitizeString(value, stringFields[key].storedLength);
    } else if (key in integerFields && typeof value === 'number') {
      const bounds = integerFields[key];
      if (Number.isFinite(value)) {
        sanitized[key] = Math.max(
          bounds.min,
          Math.min(bounds.max, Math.floor(value))
        );
      }
    } else if (jsonbFields.includes(key)) {
      sanitized[key] = sanitizeJsonb(
        (key === 'equipment' || key === 'storage') && Array.isArray(value)
          ? value.filter(isNamedItem)
          : value
      );
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
 * Validate locale
 */
export function isValidLocale(locale: unknown): locale is SupportedLocale {
  return isSupportedLocale(locale);
}

/**
 * Transform a character response from Postgres to camelCase recursively.
 * This normalizes both top-level columns and nested JSONB content.
 */
export function camelCaseJsonbFields<T extends object>(row: T): T {
  return transformKeys(row, snakeToCamel) as T;
}
