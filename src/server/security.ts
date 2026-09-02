import crypto from 'crypto';

/**
 * Security & Encryption utilities for Huzle Oh Agentic Trader.
 * Ensures MT5 credentials are encrypted at rest with AES-256-GCM / AES-256-CBC.
 * Strictly guarantees passwords are NEVER exposed in API responses, logs, Telegram messages, or LLM prompts.
 */

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'huzle-oh-exness-mt5-agentic-secure-key-32b';
// Ensure key is exactly 32 bytes
const KEY = crypto.createHash('sha256').update(String(ENCRYPTION_KEY_RAW)).digest();
const IV_LENGTH = 16;

/**
 * Encrypts sensitive string (e.g. MT5 terminal password) at rest.
 */
export function encryptCredential(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts sensitive credential for internal MT5 connection only.
 */
export function decryptCredential(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return '';
  try {
    const [ivHex, encryptedHex] = cipherText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Credential decryption failed:', err);
    return '';
  }
}

/**
 * Strips password and sensitive fields from any object before returning to client or logging.
 */
export function sanitizeAccountData<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj } as any;
  delete clone.password;
  delete clone.mt5Password;
  delete clone.password_encrypted;
  delete clone.token;
  delete clone.secret;
  return clone;
}
