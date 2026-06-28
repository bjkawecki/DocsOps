import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { canPublishDocument } from './canPublishDocument.js';

/**
 * Scope lead (publish lead) may accept or decline draft inline suggestions.
 */
export async function canResolveDraftSuggestion(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<boolean> {
  return canPublishDocument(prisma, userId, documentId);
}
