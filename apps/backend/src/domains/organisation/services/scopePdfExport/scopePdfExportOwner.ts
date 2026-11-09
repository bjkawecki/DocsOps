import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import type { ScopePdfOwnerRef } from './scopePdfExportTypes.js';

type OwnerRow = {
  companyId: string | null;
  departmentId: string | null;
  teamId: string | null;
  ownerUserId: string | null;
  company: { name: string } | null;
  department: { name: string } | null;
  team: { name: string } | null;
};

export function ownerRowToScopeRef(owner: OwnerRow): ScopePdfOwnerRef | null {
  if (owner.ownerUserId != null) return null;
  if (owner.teamId && owner.team) {
    return { kind: 'team', teamId: owner.teamId, scopeName: owner.team.name };
  }
  if (owner.departmentId && owner.department) {
    return {
      kind: 'department',
      departmentId: owner.departmentId,
      scopeName: owner.department.name,
    };
  }
  if (owner.companyId && owner.company) {
    return { kind: 'company', companyId: owner.companyId, scopeName: owner.company.name };
  }
  return null;
}

const ownerInclude = {
  company: { select: { name: true } },
  department: { select: { name: true } },
  team: { select: { name: true } },
} as const;

/** Resolve org owner scope for a context (process / project / subcontext). Personal -> null. */
export async function resolveOrgOwnerForContext(
  prisma: PrismaClient,
  contextId: string
): Promise<ScopePdfOwnerRef | null> {
  const context = await prisma.context.findUnique({
    where: { id: contextId },
    select: {
      process: {
        select: {
          owner: {
            select: {
              ...ownerInclude,
              companyId: true,
              departmentId: true,
              teamId: true,
              ownerUserId: true,
            },
          },
        },
      },
      project: {
        select: {
          owner: {
            select: {
              ...ownerInclude,
              companyId: true,
              departmentId: true,
              teamId: true,
              ownerUserId: true,
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
                  ...ownerInclude,
                  companyId: true,
                  departmentId: true,
                  teamId: true,
                  ownerUserId: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!context) return null;
  const owner =
    context.process?.owner ?? context.project?.owner ?? context.subcontext?.project?.owner ?? null;
  if (!owner) return null;
  return ownerRowToScopeRef(owner);
}
