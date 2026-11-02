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
 * Who may apply full lead-canon edits on PATCH lead-draft (not suggestion-only).
 * Includes publish leads and context-free personal creators (publish still requires a context).
 * Scope authors stay false – they only change suggestion-marked content.
 */
export async function canLeadCanonEditDocument(
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
  const { doc } = loaded.subject;
  /*
   * baseDecision === true means admin / context-free creator / write-grant path.
   * Only context-free docs use this path as lead-canon (scoped write-grant alone is not lead).
   */
  if (loaded.baseDecision === true && doc.contextId == null) return true;
  return isPersonalContextDocumentOwner(getDocumentOwner(doc), userId);
}

/**
 * Who may PATCH the shared lead draft: scope lead (publish), scope author, or personal owner.
 */
export async function canEditLeadDraft(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<boolean> {
  if (await canLeadCanonEditDocument(prisma, userId, documentId)) return true;

  const loaded = await loadPermissionSubjectAndBaseDecision(
    prisma,
    userId,
    documentId,
    GrantRole.Write,
    () => new Set<string>()
  );
  if (!loaded) return false;
  const { doc, user } = loaded.subject;
  /*
   * baseDecision === true means admin / context-free creator / write-grant path.
   * Write-grant alone must not edit the shared lead draft on scoped docs.
   * Context-free personal docs (creator) get baseDecision true and must be allowed.
   */
  if (loaded.baseDecision === true) {
    return doc.contextId == null;
  }

  if (isPersonalContextDocumentOwner(getDocumentOwner(doc), userId)) return true;
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
