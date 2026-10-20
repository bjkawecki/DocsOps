import type { PrismaClient } from '../../../generated/prisma/client.js';

/**
 * Resolve scope-lead display names for the document's owner unit at export time.
 * Personal owner → that user; org owner → leads of company/department/team.
 */
export async function resolveDocumentPdfResponsibleNames(
  prisma: PrismaClient,
  documentId: string
): Promise<string[]> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
    select: {
      context: {
        select: {
          process: {
            select: {
              owner: {
                select: {
                  ownerUserId: true,
                  companyId: true,
                  departmentId: true,
                  teamId: true,
                  ownerUser: { select: { name: true } },
                },
              },
            },
          },
          project: {
            select: {
              owner: {
                select: {
                  ownerUserId: true,
                  companyId: true,
                  departmentId: true,
                  teamId: true,
                  ownerUser: { select: { name: true } },
                },
              },
            },
          },
          subcontext: {
            select: {
              project: {
                select: {
                  owner: {
                    select: {
                      ownerUserId: true,
                      companyId: true,
                      departmentId: true,
                      teamId: true,
                      ownerUser: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const owner =
    doc?.context?.process?.owner ??
    doc?.context?.project?.owner ??
    doc?.context?.subcontext?.project?.owner ??
    null;
  if (!owner) return [];

  if (owner.ownerUserId != null) {
    const name = owner.ownerUser?.name?.trim();
    return name ? [name] : [];
  }

  if (owner.teamId) {
    const leads = await prisma.teamLead.findMany({
      where: { teamId: owner.teamId },
      select: { user: { select: { name: true } } },
      orderBy: { user: { name: 'asc' } },
    });
    return leads.map((l) => l.user.name.trim()).filter(Boolean);
  }

  if (owner.departmentId) {
    const leads = await prisma.departmentLead.findMany({
      where: { departmentId: owner.departmentId },
      select: { user: { select: { name: true } } },
      orderBy: { user: { name: 'asc' } },
    });
    return leads.map((l) => l.user.name.trim()).filter(Boolean);
  }

  if (owner.companyId) {
    const leads = await prisma.companyLead.findMany({
      where: { companyId: owner.companyId },
      select: { user: { select: { name: true } } },
      orderBy: { user: { name: 'asc' } },
    });
    return leads.map((l) => l.user.name.trim()).filter(Boolean);
  }

  return [];
}

/** Visible PDF meta line under the title: name(s), date, version. */
export function buildPdfResponsibleMetaLine(args: {
  responsibleNames: string[];
  versionNumber: number;
  publishedAt: Date;
}): string {
  const date = args.publishedAt.toISOString().slice(0, 10);
  const parts: string[] = [];
  if (args.responsibleNames.length > 0) {
    parts.push(args.responsibleNames.join(', '));
  }
  parts.push(date);
  parts.push(`Version ${args.versionNumber}`);
  return parts.join(', ');
}
