import { describe, expect, it } from 'vitest';
import { normalizeImportUserEmail } from './platformImportUsers.js';

describe('platformImportUsers', () => {
  it('normalizeImportUserEmail trims and rejects empty', () => {
    expect(normalizeImportUserEmail('  admin@example.com  ')).toBe('admin@example.com');
    expect(normalizeImportUserEmail('')).toBeNull();
    expect(normalizeImportUserEmail(null)).toBeNull();
  });
});
