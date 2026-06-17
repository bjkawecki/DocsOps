import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../app.js';
import { prisma } from '../../db.js';
import { invalidateMaintenanceLockCache } from './maintenancePreHandler.js';

describe('GET /api/v1/maintenance/status', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await prisma.systemMaintenanceLock.deleteMany({ where: { id: 'backup' } });
    invalidateMaintenanceLockCache();
    await app?.close();
  });

  it('returns inactive when no lock is held', async () => {
    await prisma.systemMaintenanceLock.deleteMany({ where: { id: 'backup' } });
    invalidateMaintenanceLockCache();

    const res = await app.inject({ method: 'GET', url: '/api/v1/maintenance/status' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ active: false });
  });

  it('returns active backup when lock is held', async () => {
    await prisma.systemMaintenanceLock.create({
      data: { id: 'backup', reason: 'restore', restoreRunId: 'restore-test' },
    });
    invalidateMaintenanceLockCache();

    const res = await app.inject({ method: 'GET', url: '/api/v1/maintenance/status' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ active: true, reason: 'restore' });
  });
});
