import type { FastifyInstance } from 'fastify';
import {
  requireAuthPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../../auth/middleware.js';
import type { RequestUser } from '../../../auth/types.js';
import { patchMeBodySchema } from '../../schemas/me.js';
import {
  setOwnerDisplayName,
  refreshContextOwnerDisplayForOwner,
} from '../../../organisation/services/contextOwnerDisplay.js';
import type { MeIdentityTeam, MeResponse } from './route-types.js';
import { userPreferencesFromJson } from './route-helpers.js';

function registerMeProfileRoutes(app: FastifyInstance): void {
  app.get('/me', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const userId = getEffectiveUserId(request as RequestWithUser);

    const user = await request.server.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        passwordHash: true,
        preferences: true,
        teamMemberships: {
          include: {
            team: { include: { department: true } },
          },
        },
        leadOfTeams: {
          include: {
            team: { include: { department: true } },
          },
        },
        departmentLeads: {
          include: { department: true },
        },
        companyLeads: {
          include: { company: true },
        },
        authorOfTeams: {
          include: {
            team: { include: { department: true } },
          },
        },
        authorOfDepartments: {
          include: { department: true },
        },
      },
    });

    const leaderTeamIds = new Set(user.leadOfTeams.map((entry) => entry.teamId));
    const teams: MeIdentityTeam[] = [];
    const departmentMap = new Map<string, { id: string; name: string }>();

    for (const membership of user.teamMemberships) {
      const role = leaderTeamIds.has(membership.teamId) ? ('leader' as const) : ('member' as const);
      teams.push({
        teamId: membership.team.id,
        teamName: membership.team.name,
        departmentId: membership.team.department.id,
        departmentName: membership.team.department.name,
        companyId: membership.team.department.companyId,
        role,
      });
      departmentMap.set(membership.team.department.id, {
        id: membership.team.department.id,
        name: membership.team.department.name,
      });
    }

    const teamIdsInIdentity = new Set(teams.map((t) => t.teamId));
    for (const leadEntry of user.leadOfTeams) {
      if (teamIdsInIdentity.has(leadEntry.teamId)) continue;
      teams.push({
        teamId: leadEntry.team.id,
        teamName: leadEntry.team.name,
        departmentId: leadEntry.team.department.id,
        departmentName: leadEntry.team.department.name,
        companyId: leadEntry.team.department.companyId,
        role: 'leader',
      });
      departmentMap.set(leadEntry.team.department.id, {
        id: leadEntry.team.department.id,
        name: leadEntry.team.department.name,
      });
      teamIdsInIdentity.add(leadEntry.team.id);
    }

    for (const authorEntry of user.authorOfTeams) {
      if (teamIdsInIdentity.has(authorEntry.teamId)) {
        const existing = teams.find((t) => t.teamId === authorEntry.teamId);
        if (existing) existing.role = 'author';
        continue;
      }
      teams.push({
        teamId: authorEntry.team.id,
        teamName: authorEntry.team.name,
        departmentId: authorEntry.team.department.id,
        departmentName: authorEntry.team.department.name,
        companyId: authorEntry.team.department.companyId,
        role: 'author',
      });
      departmentMap.set(authorEntry.team.department.id, {
        id: authorEntry.team.department.id,
        name: authorEntry.team.department.name,
      });
      teamIdsInIdentity.add(authorEntry.teamId);
    }

    const departmentLeads = user.departmentLeads.map((entry) => ({
      id: entry.department.id,
      name: entry.department.name,
      companyId: entry.department.companyId,
    }));
    for (const entry of departmentLeads) {
      departmentMap.set(entry.id, { id: entry.id, name: entry.name });
    }

    const departmentAuthors = user.authorOfDepartments.map((entry) => ({
      id: entry.department.id,
      name: entry.department.name,
      companyId: entry.department.companyId,
    }));
    for (const entry of departmentAuthors) {
      departmentMap.set(entry.id, { id: entry.id, name: entry.name });
    }

    const companyLeads = user.companyLeads.map((entry) => ({
      id: entry.company.id,
      name: entry.company.name,
    }));

    const req = request as { user: RequestUser; effectiveUserId?: string };
    const response: MeResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        hasLocalLogin: user.passwordHash != null,
      },
      identity: {
        teams,
        departments: Array.from(departmentMap.values()),
        departmentLeads,
        departmentAuthors,
        companyLeads,
      },
      preferences: userPreferencesFromJson(user.preferences),
      ...(req.effectiveUserId
        ? {
            impersonation: {
              active: true as const,
              realUser: { id: req.user.id, name: req.user.name },
            },
          }
        : {}),
    };
    return reply.send(response);
  });

  app.patch('/me', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const userId = (request as { user: RequestUser }).user.id;
    const body = patchMeBodySchema.parse(request.body);
    const updated = await request.server.prisma.user.update({
      where: { id: userId },
      data: { name: body.name },
      select: { id: true, name: true, email: true, isAdmin: true },
    });
    const prisma = request.server.prisma;
    const owners = await prisma.owner.findMany({
      where: { ownerUserId: userId },
      select: { id: true },
    });
    for (const owner of owners) {
      await setOwnerDisplayName(prisma, owner.id);
      await refreshContextOwnerDisplayForOwner(prisma, owner.id);
    }
    return reply.send(updated);
  });

  app.post('/me/deactivate', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const userId = (request as { user: RequestUser }).user.id;
    const user = await request.server.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (user.isAdmin) {
      const otherAdmins = await request.server.prisma.user.count({
        where: { isAdmin: true, deletedAt: null, id: { not: userId } },
      });
      if (otherAdmins === 0) {
        return reply.status(403).send({
          error:
            'The last administrator cannot deactivate their account. Please create another admin first.',
        });
      }
    }
    await request.server.prisma.session.deleteMany({ where: { userId } });
    await request.server.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
    return reply.status(204).send();
  });
}

export { registerMeProfileRoutes };
