import validator from 'validator';

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
  // String fields with their max lengths
  const stringFields: Record<string, number> = {
    name: 255,
    habit: 1000,
    tale: 1000,
    trait1: 255,
    trait2: 255,
    body_description: 1000,
    origin: 1000,
    notes: 10000,
  };

  // Integer fields with min/max bounds
  const integerFields: Record<string, { min: number; max: number }> = {
    current_hp: { min: -100, max: 1000 },
    max_hp: { min: 1, max: 1000 },
    omens: { min: 0, max: 100 },
    max_omens: { min: 0, max: 100 },
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
    'equipped_weapons',
    'equipped_armor',
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
 * Validate locale
 */
export function isValidLocale(locale: unknown): locale is 'en' | 'pl' {
  return locale === 'en' || locale === 'pl';
}
