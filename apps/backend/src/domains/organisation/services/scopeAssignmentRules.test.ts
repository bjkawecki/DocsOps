import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';
import {
  assertCanAssignScopeRole,
  getUserScopeRoleTier,
  ScopeAssignmentConflictError,
  stripIncompatibleOrgAssignments,
} from './scopeAssignmentRules.js';
import { loadActiveUser } from '../permissions/userAccessPredicates.js';

const TS = `scope-rules-${Date.now()}`;

describe('scopeAssignmentRules', () => {
  let companyId: string;
  let departmentId: string;
  let teamId: string;
  let team2Id: string;
  let adminUserId: string;
  let companyLeadId: string;
  let deptLeadId: string;
  let teamLeadId: string;
  let teamMemberId: string;
  let plainUserId: string;

  beforeAll(async () => {
    const pw = await hashPassword('testpass');
    const company = await prisma.company.create({ data: { name: `Rules Co ${TS}` } });
    companyId = company.id;
    const department = await prisma.department.create({
      data: { name: `Rules Dept ${TS}`, companyId },
    });
    departmentId = department.id;
    const [team, team2] = await Promise.all([
      prisma.team.create({ data: { name: `Rules Team ${TS}`, departmentId } }),
      prisma.team.create({ data: { name: `Rules Team 2 ${TS}`, departmentId } }),
    ]);
    teamId = team.id;
    team2Id = team2.id;

    const [adminUser, companyLead, deptLead, teamLead, teamMember, plain] = await Promise.all([
      prisma.user.create({
        data: { name: 'Admin', email: `admin-${TS}@test.de`, passwordHash: pw, isAdmin: true },
      }),
      prisma.user.create({
        data: { name: 'Co Lead', email: `co-${TS}@test.de`, passwordHash: pw },
      }),
      prisma.user.create({
        data: { name: 'Dept Lead', email: `dept-${TS}@test.de`, passwordHash: pw },
      }),
      prisma.user.create({
        data: { name: 'Team Lead', email: `tl-${TS}@test.de`, passwordHash: pw },
      }),
      prisma.user.create({
        data: { name: 'Member', email: `member-${TS}@test.de`, passwordHash: pw },
      }),
      prisma.user.create({
        data: { name: 'Plain', email: `plain-${TS}@test.de`, passwordHash: pw },
      }),
    ]);
    adminUserId = adminUser.id;
    companyLeadId = companyLead.id;
    deptLeadId = deptLead.id;
    teamLeadId = teamLead.id;
    teamMemberId = teamMember.id;
    plainUserId = plain.id;

    await prisma.companyLead.create({ data: { companyId, userId: companyLeadId } });
    await prisma.departmentLead.create({ data: { departmentId, userId: deptLeadId } });
    await prisma.teamLead.create({ data: { teamId, userId: teamLeadId } });
    await prisma.teamMember.create({ data: { teamId, userId: teamMemberId } });
  });

  afterAll(async () => {
    await prisma.teamMember.deleteMany({
      where: { teamId: { in: [teamId, team2Id] } },
    });
    await prisma.teamLead.deleteMany({ where: { teamId: { in: [teamId, team2Id] } } });
    await prisma.departmentLead.deleteMany({ where: { departmentId } });
    await prisma.companyLead.deleteMany({ where: { companyId } });
    await prisma.team.deleteMany({ where: { id: { in: [teamId, team2Id] } } });
    await prisma.department.deleteMany({ where: { id: departmentId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    const userIds = [adminUserId, companyLeadId, deptLeadId, teamLeadId, teamMemberId, plainUserId];
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  });

  it('getUserScopeRoleTier reflects highest role', async () => {
    const admin = await loadActiveUser(prisma, adminUserId);
    const co = await loadActiveUser(prisma, companyLeadId);
    const member = await loadActiveUser(prisma, teamMemberId);
    expect(admin && getUserScopeRoleTier(admin)).toBe('admin');
    expect(co && getUserScopeRoleTier(co)).toBe('company');
    expect(member && getUserScopeRoleTier(member)).toBe('teamMember');
  });

  it('admin cannot receive org assignments', async () => {
    await expect(
      assertCanAssignScopeRole(prisma, { userId: adminUserId, kind: 'teamMember', teamId })
    ).rejects.toBeInstanceOf(ScopeAssignmentConflictError);
  });

  it('org user cannot become admin while assignments exist', async () => {
    await expect(
      assertCanAssignScopeRole(prisma, { userId: teamMemberId, kind: 'admin' })
    ).rejects.toThrow(/organization assignments/);
  });

  it('plain user can be assigned team member', async () => {
    await expect(
      assertCanAssignScopeRole(prisma, { userId: plainUserId, kind: 'teamMember', teamId })
    ).resolves.toBeUndefined();
  });

  it('team member cannot become team lead without removing membership', async () => {
    await expect(
      assertCanAssignScopeRole(prisma, { userId: teamMemberId, kind: 'teamLead', teamId })
    ).rejects.toBeInstanceOf(ScopeAssignmentConflictError);
  });

  it('company lead cannot receive department lead', async () => {
    await expect(
      assertCanAssignScopeRole(prisma, { userId: companyLeadId, kind: 'departmentLead' })
    ).rejects.toBeInstanceOf(ScopeAssignmentConflictError);
  });

  it('stripIncompatibleOrgAssignments keeps only highest tier', async () => {
    const pw = await hashPassword('x');
    const conflict = await prisma.user.create({
      data: { name: 'Conflict', email: `conflict-${TS}@test.de`, passwordHash: pw },
    });
    await prisma.companyLead.create({ data: { companyId, userId: conflict.id } });
    await prisma.teamMember.create({ data: { teamId: team2Id, userId: conflict.id } });

    await stripIncompatibleOrgAssignments(prisma, conflict.id);

    const after = await loadActiveUser(prisma, conflict.id);
    expect(after?.companyLeads).toHaveLength(1);
    expect(after?.teamMemberships).toHaveLength(0);

    await prisma.companyLead.deleteMany({ where: { userId: conflict.id } });
    await prisma.user.delete({ where: { id: conflict.id } });
  });
});
