import { afterEach, describe, expect, it } from 'vitest';
import { encryptJson } from '../../../infrastructure/crypto/secretBox.js';
import { credentialFieldLengthsFromCiphertext } from './adminBackupDestinationService.js';

describe('credentialFieldLengthsFromCiphertext', () => {
  afterEach(() => {
    delete process.env.BACKUP_ENCRYPTION_KEY;
  });

  it('returns field lengths without values', () => {
    process.env.BACKUP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    const ciphertext = encryptJson({
      accessKeyId: 'AKIA1234',
      secretAccessKey: 'supersecretvalue',
    });
    expect(credentialFieldLengthsFromCiphertext(ciphertext)).toEqual({
      accessKeyId: 8,
      secretAccessKey: 16,
    });
  });

  it('returns empty when encryption is not configured', () => {
    expect(credentialFieldLengthsFromCiphertext('anything')).toEqual({});
  });
});
