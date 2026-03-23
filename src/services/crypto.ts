import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';

const EMAIL_PEPPER = process.env.EMAIL_PEPPER!;
const EMAIL_ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY!; // 32 bytes hex (64 chars)

if (!EMAIL_PEPPER || EMAIL_PEPPER.length < 32) {
  throw new Error(`EMAIL_PEPPER must be at least 32 characters`);
}

if (!EMAIL_ENCRYPTION_KEY || EMAIL_ENCRYPTION_KEY.length !== 64) {
  throw new Error('EMAIL_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
}

/**
 * Generate a blind index for email lookup (searchable, not reversible)
 */
export function generateEmailBlindIndex(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  return createHmac('sha256', EMAIL_PEPPER)
    .update(normalizedEmail)
    .digest('hex');
}

/**
 * Encrypt email for storage (reversible with key)
 */
export function encryptEmail(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const iv = randomBytes(16);
  const key = Buffer.from(EMAIL_ENCRYPTION_KEY, 'hex');
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(normalizedEmail, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt email for sending verification/reset emails
 */
export function decryptEmail(encryptedEmail: string): string {
  const parts = encryptedEmail.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted email format');
  }
  const [ivHex, authTagHex, encrypted] = parts;
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted email format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  if (iv.length !== 16) {
    throw new Error('Invalid IV length');
  }
  const authTag = Buffer.from(authTagHex, 'hex');
  if (authTag.length !== 16) {
    throw new Error('Invalid GCM auth tag length');
  }
  const key = Buffer.from(EMAIL_ENCRYPTION_KEY, 'hex');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
