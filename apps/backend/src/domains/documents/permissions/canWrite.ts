import type { Prisma, PrismaClient } from '../../../../generated/prisma/client.js';
import { GrantRole } from '../../../../generated/prisma/client.js';
import type { DocumentForPermission } from './documentLoad.js';
import {
  getDocumentOwner,
  isCompanyLeadForOwner,
  isPersonalContextDocumentOwner,
  loadPermissionSubjectAndBaseDecision,
} from './canRead.js';
import { isScopeAuthorForDocument } from './scopeAuthor.js';

/**
 * Checks if the user may edit document content in the shared lead draft.
 * @param documentOrId - documentId (string) oder bereits geladenes Document mit Context/Grants
 */
export async function canWrite(
  prisma: PrismaClient | Prisma.TransactionClient,
  userId: string,
  documentOrId: string | DocumentForPermission
): Promise<boolean> {
  const loaded = await loadPermissionSubjectAndBaseDecision(
    prisma,
    userId,
    documentOrId,
    GrantRole.Write,
    () => new Set<string>()
  );
  if (!loaded) return false;
  const { doc, user } = loaded.subject;
  if (loaded.baseDecision !== null) return loaded.baseDecision;

  const owner = getDocumentOwner(doc);
  if (isPersonalContextDocumentOwner(owner, userId)) return true;

  if (isScopeAuthorForDocument(user, doc)) return true;

  if (isCompanyLeadForOwner(user, owner)) return true;

  return false;
}
