import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../../db.js';
import { emptyBlockDocumentJson } from '../blocks/documentBlocksBackfill.js';
import {
  applyPublishReset,
  markStillValid,
  markNeedsUpdate,
  markNeedsArchive,
  clearOutcome,
  updateDocumentInterval,
} from './healthCheckService.js';
import { addDays } from './healthCheckPolicy.js';

const TS = `hc-svc-${Date.now()}`;

describe('healthCheckService', () => {
  let companyId: string;
  let departmentId: string;
  let teamId: string;
  let ownerId: string;
  let contextId: string;
  let documentId: string;
  let actorId: string;

  beforeAll(async () => {
    await prisma.systemSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        healthCheckDefaultIntervalDays: 90,
        healthCheckAutoScanEnabled: false,
      },
      update: {
        healthCheckDefaultIntervalDays: 90,
        healthCheckAutoScanEnabled: false,
      },
    });

    const company = await prisma.company.create({ data: { name: `HC Co ${TS}` } });
    companyId = company.id;
    const department = await prisma.department.create({
      data: { name: `HC Dept ${TS}`, companyId },
    });
    departmentId = department.id;
    const team = await prisma.team.create({
      data: { name: `HC Team ${TS}`, departmentId },
    });
    teamId = team.id;
    const owner = await prisma.owner.create({
      data: { teamId },
    });
    ownerId = owner.id;
    const ctx = await prisma.context.create({ data: {} });
    contextId = ctx.id;
    await prisma.process.create({
      data: {
        name: `HC Process ${TS}`,
        ownerId,
        contextId,
      },
    });

    const actor = await prisma.user.create({
      data: { name: 'HC Actor', email: `hc-actor-${TS}@test.de` },
    });
    actorId = actor.id;

    const blocks = emptyBlockDocumentJson();
    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          title: `HC Doc ${TS}`,
          contextId,
          draftBlocks: blocks,
          healthCheckNeedsUpdate: true,
          healthCheckSnoozedUntil: new Date('2026-02-01T00:00:00.000Z'),
          healthCheckLastDecision: 'needs_update',
          healthCheckLastDecisionAt: new Date('2026-01-15T00:00:00.000Z'),
          healthCheckLastDecisionById: actorId,
        },
      });
      const version = await tx.documentVersion.create({
        data: {
          documentId: created.id,
          blocks,
          blocksSchemaVersion: 0,
          versionNumber: 1,
          createdById: actorId,
        },
      });
      return tx.document.update({
        where: { id: created.id },
        data: {
          publishedAt: new Date('2026-01-01T00:00:00.000Z'),
          currentPublishedVersionId: version.id,
        },
      });
    });
    documentId = doc.id;
  });

  afterAll(async () => {
    await prisma.documentHealthCheckEvent.deleteMany({ where: { documentId } });
    await prisma.document.updateMany({
      where: { id: documentId },
      data: { currentPublishedVersionId: null, publishedAt: null },
    });
    await prisma.documentVersion.deleteMany({ where: { documentId } });
    await prisma.document.deleteMany({ where: { id: documentId } });
    await prisma.process.deleteMany({ where: { contextId } });
    await prisma.context.deleteMany({ where: { id: contextId } });
    await prisma.owner.deleteMany({ where: { id: ownerId } });
    await prisma.team.deleteMany({ where: { id: teamId } });
    await prisma.department.deleteMany({ where: { id: departmentId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.user.deleteMany({ where: { id: actorId } });
  });

  it('applyPublishReset clears flags and sets nextAt from publishedAt + org default', async () => {
    const publishedAt = new Date('2026-03-01T00:00:00.000Z');
    await applyPublishReset(prisma, documentId, publishedAt, actorId);

    const doc = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
    expect(doc.healthCheckNeedsUpdate).toBe(false);
    expect(doc.healthCheckNeedsArchive).toBe(false);
    expect(doc.healthCheckSnoozedUntil).toBeNull();
    expect(doc.healthCheckLastDecision).toBeNull();
    expect(doc.healthCheckLastDecisionAt).toBeNull();
    expect(doc.healthCheckLastDecisionById).toBeNull();
    expect(doc.healthCheckNextAt?.toISOString()).toBe(addDays(publishedAt, 90).toISOString());

    const event = await prisma.documentHealthCheckEvent.findFirst({
      where: { documentId, decision: 'publish_reset' },
      orderBy: { at: 'desc' },
    });
    expect(event).toBeTruthy();
    expect(event?.intervalDays).toBe(90);
  });

  it('markStillValid / needsUpdate update document and events', async () => {
    const t0 = new Date('2026-04-01T00:00:00.000Z');
    await markStillValid(prisma, documentId, actorId, t0);
    let doc = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
    expect(doc.healthCheckLastDecision).toBe('still_valid');
    expect(doc.healthCheckNeedsUpdate).toBe(false);
    expect(doc.healthCheckNextAt?.toISOString()).toBe(addDays(t0, 90).toISOString());

    await markStillValid(prisma, documentId, actorId, t0, 30);
    doc = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
    expect(doc.healthCheckNextAt?.toISOString()).toBe(addDays(t0, 30).toISOString());
    expect(doc.healthCheckLastDecision).toBe('still_valid');

    await markNeedsUpdate(prisma, documentId, actorId, t0);
    doc = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
    expect(doc.healthCheckNeedsUpdate).toBe(true);
    expect(doc.healthCheckNeedsArchive).toBe(false);
    expect(doc.healthCheckLastDecision).toBe('needs_update');

    await markNeedsArchive(prisma, documentId, actorId, t0);
    doc = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
    expect(doc.healthCheckNeedsArchive).toBe(true);
    expect(doc.healthCheckNeedsUpdate).toBe(false);
    expect(doc.healthCheckLastDecision).toBe('archive');

    const nextAtBeforeClear = doc.healthCheckNextAt;
    await clearOutcome(prisma, documentId, actorId);
    doc = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
    expect(doc.healthCheckNeedsArchive).toBe(false);
    expect(doc.healthCheckNeedsUpdate).toBe(false);
    expect(doc.healthCheckLastDecision).toBeNull();
    expect(doc.healthCheckNextAt?.toISOString()).toBe(nextAtBeforeClear?.toISOString());
  });

  it('updateDocumentInterval stores override and recalculates nextAt from decision anchor', async () => {
    const decisionAt = new Date('2026-05-01T00:00:00.000Z');
    await prisma.document.update({
      where: { id: documentId },
      data: {
        healthCheckNeedsUpdate: false,
        healthCheckNeedsArchive: false,
        healthCheckSnoozedUntil: null,
        healthCheckLastDecision: 'still_valid',
        healthCheckLastDecisionAt: decisionAt,
        healthCheckNextAt: addDays(decisionAt, 90),
        healthCheckIntervalDays: null,
      },
    });

    await updateDocumentInterval(prisma, documentId, 30, new Date('2026-05-10T00:00:00.000Z'));
    const doc = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
    expect(doc.healthCheckIntervalDays).toBe(30);
    expect(doc.healthCheckNextAt?.toISOString()).toBe(addDays(decisionAt, 30).toISOString());
  });
});
