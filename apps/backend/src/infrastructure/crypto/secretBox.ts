import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const raw = process.env.BACKUP_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error('BACKUP_ENCRYPTION_KEY is not configured');
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('BACKUP_ENCRYPTION_KEY must be 32 bytes (base64-encoded)');
  }
  return key;
}

/**
 * Encrypts a JSON-serializable value for storage (e.g. backup destination credentials).
 */
export function encryptJson(value: unknown): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypts a value produced by {@link encryptJson}.
 */
export function decryptJson<T = unknown>(ciphertext: string): T {
  const key = getEncryptionKey();
  const data = Buffer.from(ciphertext, 'base64');
  if (data.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error('Invalid ciphertext');
  }
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8')) as T;
}

export function isBackupEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}
