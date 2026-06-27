import { describe, it, expect } from 'vitest';
import {
  replaceDocumentUserGrants,
  UnsupportedScopeWriteGrantError,
} from './documentGrantsService.js';

describe('documentGrantsService', () => {
  it('replaceDocumentUserGrants rejects write grants', async () => {
    const prisma = {} as never;
    await expect(
      replaceDocumentUserGrants(prisma, {
        documentId: 'doc-1',
        grants: [{ userId: 'user-1', role: 'Write' }],
      })
    ).rejects.toBeInstanceOf(UnsupportedScopeWriteGrantError);
  });
});
