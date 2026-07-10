import type { PrismaClient } from '../../../../generated/prisma/client.js';
import type { z } from 'zod';
import type { listUsersQuerySchema } from '../schemas/users.js';
import { addTeamMembershipCatalogRow } from './adminUsersRouteSupport.js';

type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export type AdminUsersListItem = {
  id: string;
  name: string;
  email: string | null;
  isAdmin: boolean;
  deletedAt: Date | null;
  role:
    | 'Admin'
    | 'Company Lead'
    | 'Department Lead'
    | 'Team Lead'
    | 'Department Author'
    | 'Team Author'
    | 'User';
  teams: Array<{
    id: string;
    name: string;
    departmentName: string;
    isLead: boolean;
    isAuthor: boolean;
  }>;
  departments: Array<{ id: string; name: string }>;
  departmentsAsLead: Array<{ id: string; name: string }>;
  departmentsAsAuthor: Array<{ id: string; name: string }>;
};

export type AdminUsersListResult = {
  items: AdminUsersListItem[];
  total: number;
  limit: number;
  offset: number;
  activeAdminCount: number;
};

export async function listAdminUsers(
  prisma: PrismaClient,
  query: ListUsersQuery
): Promise<AdminUsersListResult> {
  const where: {
    deletedAt?: null | { not: null };
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' };
      email?: { contains: string; mode: 'insensitive' };
    }>;
  } = {};
  if (!query.includeDeactivated) {
    where.deletedAt = null;
  }
  if (query.search && query.search.trim() !== '') {
    const term = query.search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
    ];
  }

  const sortByRelation =
    query.sortBy === 'teams' || query.sortBy === 'departments' || query.sortBy === 'role';
  const CAP_FOR_RELATION_SORT = 5000;

  let users: Array<{
    id: string;
    name: string;
    email: string | null;
    isAdmin: boolean;
    deletedAt: Date | null;
  }>;
  let total: number;

  if (sortByRelation) {
    const [usersAll, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, isAdmin: true, deletedAt: true },
        orderBy: { name: 'asc' },
        take: CAP_FOR_RELATION_SORT,
      }),
      prisma.user.count({ where }),
    ]);
    users = usersAll;
    total = totalCount > CAP_FOR_RELATION_SORT ? CAP_FOR_RELATION_SORT : totalCount;
  } else {
    const dbSortField = query.sortBy === 'role' ? undefined : query.sortBy;
    const orderBy = dbSortField
      ? ({ [dbSortField]: query.sortOrder } as {
          name?: 'asc' | 'desc';
          email?: 'asc' | 'desc';
          isAdmin?: 'asc' | 'desc';
          deletedAt?: 'asc' | 'desc';
        })
      : { name: 'asc' as const };
    const [usersPage, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, isAdmin: true, deletedAt: true },
        orderBy,
        take: query.limit,
        skip: query.offset,
      }),
      prisma.user.count({ where }),
    ]);
    users = usersPage;
    total = totalCount;
  }

  const userIds = users.map((u) => u.id);
  const [
    teamLeadRows,
    departmentLeadRows,
    companyLeadRows,
    teamMemberRows,
    teamAuthorRows,
    departmentAuthorRows,
  ] = await Promise.all([
    prisma.teamLead.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        teamId: true,
        team: {
          select: { id: true, name: true, department: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.departmentLead.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, department: { select: { id: true, name: true } } },
    }),
    prisma.companyLead.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, company: { select: { id: true, name: true } } },
    }),
    prisma.teamMember.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        team: {
          select: { id: true, name: true, department: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.teamAuthor.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        team: {
          select: { id: true, name: true, department: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.departmentAuthor.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, department: { select: { id: true, name: true } } },
    }),
  ]);
  const teamLeadSet = new Set(teamLeadRows.map((r) => r.userId));
  const departmentLeadSet = new Set(departmentLeadRows.map((r) => r.userId));
  const companyLeadSet = new Set(companyLeadRows.map((r) => r.userId));
  const teamsByUser = new Map<
    string,
    Array<{ id: string; name: string; departmentName: string }>
  >();
  const departmentsByUser = new Map<string, Array<{ id: string; name: string }>>();
  const departmentsAsLeadByUser = new Map<string, Array<{ id: string; name: string }>>();
  const departmentsAsAuthorByUser = new Map<string, Array<{ id: string; name: string }>>();
  for (const r of teamMemberRows) {
    addTeamMembershipCatalogRow(r, teamsByUser, departmentsByUser);
  }
  for (const r of teamLeadRows) {
    addTeamMembershipCatalogRow(r, teamsByUser, departmentsByUser);
  }
  for (const r of teamAuthorRows) {
    addTeamMembershipCatalogRow(r, teamsByUser, departmentsByUser);
    const deptList = departmentsByUser.get(r.userId) ?? [];
    if (!deptList.some((d) => d.id === r.team.department.id)) {
      deptList.push({ id: r.team.department.id, name: r.team.department.name });
    }
    departmentsByUser.set(r.userId, deptList);
  }
  for (const r of departmentLeadRows) {
    const deptList = departmentsByUser.get(r.userId) ?? [];
    if (!deptList.some((d) => d.id === r.department.id)) {
      deptList.push({ id: r.department.id, name: r.department.name });
    }
    departmentsByUser.set(r.userId, deptList);
    const leadList = departmentsAsLeadByUser.get(r.userId) ?? [];
    leadList.push({ id: r.department.id, name: r.department.name });
    departmentsAsLeadByUser.set(r.userId, leadList);
  }
  for (const r of departmentAuthorRows) {
    const deptList = departmentsByUser.get(r.userId) ?? [];
    if (!deptList.some((d) => d.id === r.department.id)) {
      deptList.push({ id: r.department.id, name: r.department.name });
    }
    departmentsByUser.set(r.userId, deptList);
    const authorList = departmentsAsAuthorByUser.get(r.userId) ?? [];
    authorList.push({ id: r.department.id, name: r.department.name });
    departmentsAsAuthorByUser.set(r.userId, authorList);
  }
  const teamAuthorSet = new Set(teamAuthorRows.map((r) => r.userId));
  const departmentAuthorSet = new Set(departmentAuthorRows.map((r) => r.userId));
  let items: AdminUsersListItem[] = users.map((u) => {
    const role = u.isAdmin
      ? ('Admin' as const)
      : companyLeadSet.has(u.id)
        ? ('Company Lead' as const)
        : departmentLeadSet.has(u.id)
          ? ('Department Lead' as const)
          : teamLeadSet.has(u.id)
            ? ('Team Lead' as const)
            : departmentAuthorSet.has(u.id)
              ? ('Department Author' as const)
              : teamAuthorSet.has(u.id)
                ? ('Team Author' as const)
                : ('User' as const);
    const teamsRaw = teamsByUser.get(u.id) ?? [];
    const teams = teamsRaw.map((t) => ({
      ...t,
      isLead: teamLeadRows.some((r) => r.userId === u.id && r.teamId === t.id),
      isAuthor: teamAuthorRows.some((r) => r.userId === u.id && r.team.id === t.id),
    }));
    for (const r of teamAuthorRows) {
      if (r.userId !== u.id) continue;
      if (teams.some((t) => t.id === r.team.id)) continue;
      teams.push({
        id: r.team.id,
        name: r.team.name,
        departmentName: r.team.department.name,
        isLead: false,
        isAuthor: true,
      });
    }
    const departments = departmentsByUser.get(u.id) ?? [];
    const departmentsAsLead = departmentsAsLeadByUser.get(u.id) ?? [];
    const departmentsAsAuthor = departmentsAsAuthorByUser.get(u.id) ?? [];
    return {
      ...u,
      role,
      teams,
      departments,
      departmentsAsLead,
      departmentsAsAuthor,
    };
  });

  if (sortByRelation) {
    const dir = query.sortOrder === 'asc' ? 1 : -1;
    if (query.sortBy === 'role') {
      items.sort((a, b) => dir * (a.role < b.role ? -1 : a.role > b.role ? 1 : 0));
    } else {
      const key = query.sortBy === 'teams' ? 'teams' : 'departments';
      items.sort((a, b) => {
        const aStr =
          key === 'teams'
            ? [...a.teams]
                .map((t) => t.name)
                .sort()
                .join(', ') || '\uFFFF'
            : [...a.departments]
                .map((d) => d.name)
                .sort()
                .join(', ') || '\uFFFF';
        const bStr =
          key === 'teams'
            ? [...b.teams]
                .map((t) => t.name)
                .sort()
                .join(', ') || '\uFFFF'
            : [...b.departments]
                .map((d) => d.name)
                .sort()
                .join(', ') || '\uFFFF';
        return dir * (aStr < bStr ? -1 : aStr > bStr ? 1 : 0);
      });
    }
    items = items.slice(query.offset, query.offset + query.limit);
  }

  const activeAdminCount = await prisma.user.count({
    where: { isAdmin: true, deletedAt: null },
  });

  return {
    items,
    total,
    limit: query.limit,
    offset: query.offset,
    activeAdminCount,
  };
}
