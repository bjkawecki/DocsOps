import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';
import { emptyBlockDocumentJson } from '../../documents/services/blocks/documentBlocksBackfill.js';
import { canRunHealthCheck, canRunHealthCheckForDocument } from './healthCheckPermissions.js';

const TS = `hc-perm-${Date.now()}`;
const PASSWORD = 'testpass';

describe('canRunHealthCheck', () => {
  let companyId: string;
  let departmentId: string;
  let teamId: string;
  let teamLeadId: string;
  let memberId: string;
  let adminId: string;
  let kmId: string;
  let otherDeptId: string;
  let ownerId: string;
  let contextId: string;
  let documentId: string;

  beforeAll(async () => {
    const pw = await hashPassword(PASSWORD);
    const company = await prisma.company.create({ data: { name: `HC Perm Co ${TS}` } });
    companyId = company.id;
    const department = await prisma.department.create({
      data: { name: `HC Perm Dept ${TS}`, companyId },
    });
    departmentId = department.id;
    const otherDept = await prisma.department.create({
      data: { name: `HC Perm Other ${TS}`, companyId },
    });
    otherDeptId = otherDept.id;
    const team = await prisma.team.create({
      data: { name: `HC Perm Team ${TS}`, departmentId },
    });
    teamId = team.id;

    const [teamLead, member, admin, km] = await Promise.all([
      prisma.user.create({
        data: { name: 'TL', email: `hc-tl-${TS}@test.de`, passwordHash: pw },
      }),
      prisma.user.create({
        data: { name: 'Mem', email: `hc-mem-${TS}@test.de`, passwordHash: pw },
      }),
      prisma.user.create({
        data: {
          name: 'Adm',
          email: `hc-adm-${TS}@test.de`,
          passwordHash: pw,
          isAdmin: true,
        },
      }),
      prisma.user.create({
        data: {
          name: 'KM',
          email: `hc-km-${TS}@test.de`,
          passwordHash: pw,
          isKnowledgeManager: true,
        },
      }),
    ]);
    teamLeadId = teamLead.id;
    memberId = member.id;
    adminId = admin.id;
    kmId = km.id;

    await prisma.teamLead.create({ data: { teamId, userId: teamLeadId } });
    await prisma.teamMember.create({ data: { teamId, userId: memberId } });
    await prisma.knowledgeManagerTeam.create({ data: { teamId, userId: kmId } });

    const owner = await prisma.owner.create({ data: { teamId } });
    ownerId = owner.id;
    const ctx = await prisma.context.create({ data: {} });
    contextId = ctx.id;
    await prisma.process.create({
      data: {
        name: `HC Perm Process ${TS}`,
        ownerId,
        contextId,
      },
    });
    const blocks = emptyBlockDocumentJson();
    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: { title: `HC Perm Doc ${TS}`, contextId, draftBlocks: blocks },
      });
      const version = await tx.documentVersion.create({
        data: {
          documentId: created.id,
          blocks,
          blocksSchemaVersion: 0,
          versionNumber: 1,
          createdById: teamLeadId,
        },
      });
      return tx.document.update({
        where: { id: created.id },
        data: {
          publishedAt: new Date(),
          currentPublishedVersionId: version.id,
        },
      });
    });
    documentId = doc.id;
  });

  afterAll(async () => {
    await prisma.document.updateMany({
      where: { id: documentId },
      data: { currentPublishedVersionId: null, publishedAt: null },
    });
    await prisma.documentVersion.deleteMany({ where: { documentId } });
    await prisma.document.deleteMany({ where: { id: documentId } });
    await prisma.process.deleteMany({ where: { contextId } });
    await prisma.context.deleteMany({ where: { id: contextId } });
    await prisma.owner.deleteMany({ where: { id: ownerId } });
    await prisma.knowledgeManagerTeam.deleteMany({ where: { userId: kmId } });
    await prisma.teamLead.deleteMany({ where: { teamId } });
    await prisma.teamMember.deleteMany({ where: { teamId } });
    await prisma.team.deleteMany({ where: { id: teamId } });
    await prisma.department.deleteMany({ where: { id: { in: [departmentId, otherDeptId] } } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.session.deleteMany({
      where: { userId: { in: [teamLeadId, memberId, adminId, kmId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [teamLeadId, memberId, adminId, kmId] } },
    });
  });

  it('team lead yes, member no, admin no', async () => {
    expect(await canRunHealthCheck(prisma, teamLeadId, { type: 'team', teamId })).toBe(true);
    expect(await canRunHealthCheck(prisma, memberId, { type: 'team', teamId })).toBe(false);
    expect(await canRunHealthCheck(prisma, adminId, { type: 'team', teamId })).toBe(false);
  });

  it('KM on assigned team yes, other department no', async () => {
    expect(await canRunHealthCheck(prisma, kmId, { type: 'team', teamId })).toBe(true);
    expect(
      await canRunHealthCheck(prisma, kmId, { type: 'department', departmentId: otherDeptId })
    ).toBe(false);
  });

  it('canRunHealthCheckForDocument follows owner team lead', async () => {
    expect(await canRunHealthCheckForDocument(prisma, teamLeadId, documentId)).toBe(true);
    expect(await canRunHealthCheckForDocument(prisma, memberId, documentId)).toBe(false);
    expect(await canRunHealthCheckForDocument(prisma, adminId, documentId)).toBe(false);
    expect(await canRunHealthCheckForDocument(prisma, kmId, documentId)).toBe(true);
  });
});
