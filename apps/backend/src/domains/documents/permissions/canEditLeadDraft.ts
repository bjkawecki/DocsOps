import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { GrantRole } from '../../../../generated/prisma/client.js';
import { canPublishDocument } from './canPublishDocument.js';
import { canWrite } from './canWrite.js';
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
 * Read lead draft: anyone who can write or edit the draft.
 */
export async function canReadLeadDraft(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<boolean> {
  const [write, edit] = await Promise.all([
    canWrite(prisma, userId, documentId),
    canEditLeadDraft(prisma, userId, documentId),
  ]);
  return write || edit;
}
