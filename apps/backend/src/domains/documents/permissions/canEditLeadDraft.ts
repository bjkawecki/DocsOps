import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { GrantRole } from '../../../../generated/prisma/client.js';
import { canPublishDocument } from './canPublishDocument.js';
import {
  getDocumentOwner,
  isPersonalContextDocumentOwner,
  loadPermissionSubjectAndBaseDecision,
} from './canRead.js';
import { isScopeAuthorForDocument } from './scopeAuthor.js';

/**
 * Who may PATCH the shared lead draft: scope lead (publish), scope author, or personal owner.
 */
export async function canEditLeadDraft(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<boolean> {
  if (await canPublishDocument(prisma, userId, documentId)) return true;

  const loaded = await loadPermissionSubjectAndBaseDecision(
    prisma,
    userId,
    documentId,
    GrantRole.Write,
    () => new Set<string>()
  );
  if (!loaded) return false;
  if (loaded.baseDecision === true) return false;

  const { doc, user } = loaded.subject;
  const owner = getDocumentOwner(doc);
  if (isPersonalContextDocumentOwner(owner, userId)) return true;
  return isScopeAuthorForDocument(user, doc);
}

/**
 * Read lead draft: scope lead / scope author / personal owner (not document write-grant alone).
 */
export async function canReadLeadDraft(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<boolean> {
  return canEditLeadDraft(prisma, userId, documentId);
}
