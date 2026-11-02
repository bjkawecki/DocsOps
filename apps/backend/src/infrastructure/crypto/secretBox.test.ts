import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { decryptJson, encryptJson } from './secretBox.js';

describe('secretBox', () => {
  const previous = process.env.BACKUP_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.BACKUP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  });

  afterEach(() => {
    if (previous == null) delete process.env.BACKUP_ENCRYPTION_KEY;
    else process.env.BACKUP_ENCRYPTION_KEY = previous;
  });

  it('roundtrips JSON values', () => {
    const value = { accessKeyId: 'key', secretAccessKey: 'secret' };
    const encrypted = encryptJson(value);
    expect(decryptJson(encrypted)).toEqual(value);
  });
});
