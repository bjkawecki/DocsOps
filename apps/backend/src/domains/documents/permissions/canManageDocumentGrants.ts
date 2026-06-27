import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { canPublishDocument } from './canPublishDocument.js';

/**
 * May replace read grants on a document. Scope leads only (not authors).
 */
export async function canManageDocumentGrants(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<boolean> {
  return canPublishDocument(prisma, userId, documentId);
}
