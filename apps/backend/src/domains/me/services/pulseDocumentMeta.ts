import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { getScopeFromOwner, ownerScopeSelect } from '../routes/me/route-helpers.js';

export type PulseDocMeta = {
  id: string;
  title: string;
  scopeName: string;
  contextName: string | null;
  contextTypeLabel: string | null;
};

export function formatPulseContextType(contextType: string | null | undefined): string | null {
  if (contextType === 'process') return 'process';
  if (contextType === 'project') return 'project';
  return null;
}

const documentMetaSelect = {
  id: true,
  title: true,
  context: {
    select: {
      displayName: true,
      contextType: true,
      process: { select: { owner: { select: ownerScopeSelect } } },
      project: { select: { owner: { select: ownerScopeSelect } } },
      subcontext: {
        select: { project: { select: { owner: { select: ownerScopeSelect } } } },
      },
    },
  },
} as const;

export async function loadPulseDocumentMeta(
  prisma: PrismaClient,
  documentIds: string[]
): Promise<Map<string, PulseDocMeta>> {
  const unique = [...new Set(documentIds.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const docs = await prisma.document.findMany({
    where: { id: { in: unique } },
    select: documentMetaSelect,
  });
  const map = new Map<string, PulseDocMeta>();
  for (const doc of docs) {
    const owner =
      doc.context?.process?.owner ??
      doc.context?.project?.owner ??
      doc.context?.subcontext?.project?.owner ??
      null;
    const scope = getScopeFromOwner(owner);
    map.set(doc.id, {
      id: doc.id,
      title: doc.title,
      scopeName: scope.scopeName,
      contextName: doc.context?.displayName?.trim() || null,
      contextTypeLabel: formatPulseContextType(doc.context?.contextType ?? null),
    });
  }
  return map;
}

export function pulseDocMetaOrFallback(
  metaById: Map<string, PulseDocMeta>,
  documentId: string,
  fallbackTitle?: string | null
): PulseDocMeta {
  const m = metaById.get(documentId);
  if (m) return m;
  return {
    id: documentId,
    title: fallbackTitle?.trim() || documentId,
    scopeName: 'Personal',
    contextName: null,
    contextTypeLabel: null,
  };
}
