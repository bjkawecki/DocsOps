import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';
import { emptyBlockDocumentJson } from '../../documents/services/blocks/documentBlocksBackfill.js';

const TEST_EMAIL = `me-prefs-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpass';

function getCookieHeader(res: { headers: Record<string, unknown> }): string {
  const setCookie = res.headers['set-cookie'];
  if (Array.isArray(setCookie)) return setCookie.join('; ');
  if (typeof setCookie === 'string') return setCookie;
  return '';
}

describe('Me preferences routes (GET/PATCH /me/preferences)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let testUserId: string;

  beforeAll(async () => {
    app = await buildApp();
    const passwordHash = await hashPassword(TEST_PASSWORD);
    const user = await prisma.user.create({
      data: {
        name: 'Me Prefs Test User',
        email: TEST_EMAIL,
        passwordHash,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.session.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await app.close();
  });

  it('GET /api/v1/me/preferences mit Session → 200 + preferences', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/preferences',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body).toBeDefined();
  });

  it('PATCH /api/v1/me/preferences → theme, sidebarPinned und sidebarCollapsed gespeichert', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/preferences',
      headers: { cookie },
      payload: { theme: 'dark', sidebarPinned: true, sidebarCollapsed: true },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { theme: string; sidebarPinned: boolean; sidebarCollapsed: boolean };
    expect(body.theme).toBe('dark');
    expect(body.sidebarPinned).toBe(true);
    expect(body.sidebarCollapsed).toBe(true);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: testUserId },
      select: { preferences: true },
    });
    const prefs = user.preferences as {
      theme?: string;
      sidebarPinned?: boolean;
      sidebarCollapsed?: boolean;
    } | null;
    expect(prefs?.theme).toBe('dark');
    expect(prefs?.sidebarPinned).toBe(true);
    expect(prefs?.sidebarCollapsed).toBe(true);
  });

  it('PATCH /api/v1/me/preferences → primaryColor gespeichert und per GET geliefert', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/preferences',
      headers: { cookie },
      payload: { primaryColor: 'green' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { primaryColor: string };
    expect(body.primaryColor).toBe('green');

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/preferences',
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    const getBody = getRes.json() as { primaryColor?: string };
    expect(getBody.primaryColor).toBe('green');

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: testUserId },
      select: { preferences: true },
    });
    const prefs = user.preferences as { primaryColor?: string } | null;
    expect(prefs?.primaryColor).toBe('green');
  });

  it('PATCH /api/v1/me/preferences → textSize gespeichert und per GET geliefert', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/preferences',
      headers: { cookie },
      payload: { textSize: 'larger' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { textSize: string };
    expect(body.textSize).toBe('larger');

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/preferences',
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    const getBody = getRes.json() as { textSize?: string };
    expect(getBody.textSize).toBe('larger');

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: testUserId },
      select: { preferences: true },
    });
    const prefs = user.preferences as { textSize?: string } | null;
    expect(prefs?.textSize).toBe('larger');
  });

  it('PATCH /api/v1/me/preferences → documentReadingFont gespeichert und per GET geliefert', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/preferences',
      headers: { cookie },
      payload: { documentReadingFont: 'serif' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { documentReadingFont: string };
    expect(body.documentReadingFont).toBe('serif');

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/preferences',
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    const getBody = getRes.json() as { documentReadingFont?: string };
    expect(getBody.documentReadingFont).toBe('serif');

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: testUserId },
      select: { preferences: true },
    });
    const prefs = user.preferences as { documentReadingFont?: string } | null;
    expect(prefs?.documentReadingFont).toBe('serif');
  });

  it('PATCH /api/v1/me/preferences → scopeRecentPanelOpen gespeichert und per GET geliefert', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/preferences',
      headers: { cookie },
      payload: { scopeRecentPanelOpen: false },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { scopeRecentPanelOpen: boolean };
    expect(body.scopeRecentPanelOpen).toBe(false);

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/preferences',
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    const getBody = getRes.json() as { scopeRecentPanelOpen?: boolean };
    expect(getBody.scopeRecentPanelOpen).toBe(false);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/preferences',
      headers: { cookie },
      payload: { scopeRecentPanelOpen: true },
    });
    expect(patchRes.statusCode).toBe(200);
    const patchBody = patchRes.json() as { scopeRecentPanelOpen: boolean };
    expect(patchBody.scopeRecentPanelOpen).toBe(true);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: testUserId },
      select: { preferences: true },
    });
    const prefs = user.preferences as { scopeRecentPanelOpen?: boolean } | null;
    expect(prefs?.scopeRecentPanelOpen).toBe(true);
  });

  it('PATCH /api/v1/me/preferences → recentItemsByScope gespeichert und per GET geliefert', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const scopeKey = 'company:clh3test000008l008eazy0001';
    const items = [
      { type: 'process' as const, id: 'clh3test000008l008eazy0002', name: 'Prozess A' },
      { type: 'project' as const, id: 'clh3test000008l008eazy0003', name: 'Projekt B' },
    ];

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/preferences',
      headers: { cookie },
      payload: { recentItemsByScope: { [scopeKey]: items } },
    });
    expect(res.statusCode).toBe(200);
    type RecentItem = { type: string; id: string; name: string };
    const body = res.json() as { recentItemsByScope?: Record<string, RecentItem[]> };
    expect(body.recentItemsByScope).toBeDefined();
    expect(body.recentItemsByScope?.[scopeKey]).toHaveLength(2);
    expect(body.recentItemsByScope?.[scopeKey]?.[0].type).toBe('process');
    expect(body.recentItemsByScope?.[scopeKey]?.[0].name).toBe('Prozess A');

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/preferences',
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    const getBody = getRes.json() as { recentItemsByScope?: Record<string, RecentItem[]> };
    expect(getBody.recentItemsByScope?.[scopeKey]).toHaveLength(2);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: testUserId },
      select: { preferences: true },
    });
    const prefs = user.preferences as { recentItemsByScope?: Record<string, unknown[]> } | null;
    expect(prefs?.recentItemsByScope?.[scopeKey]).toHaveLength(2);
  });

  it('PATCH /api/v1/me/preferences → recentItemsByScope dedupliziert type+id', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const doc = await prisma.document.create({
      data: {
        title: 'Team Wiki',
        createdById: testUserId,
        draftBlocks: emptyBlockDocumentJson(),
      },
    });
    const scopeKey = 'team:clh3test000008l008eazy0099';
    const items = [
      { type: 'document' as const, id: doc.id, name: 'Team Wiki' },
      { type: 'document' as const, id: doc.id, name: 'Team Wiki' },
      { type: 'document' as const, id: doc.id, name: 'Team Wiki' },
    ];

    try {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/me/preferences',
        headers: { cookie },
        payload: { recentItemsByScope: { [scopeKey]: items } },
      });
      expect(res.statusCode).toBe(200);
      type RecentItem = { type: string; id: string; name: string };
      const body = res.json() as { recentItemsByScope?: Record<string, RecentItem[]> };
      expect(body.recentItemsByScope?.[scopeKey]).toHaveLength(1);
      expect(body.recentItemsByScope?.[scopeKey]?.[0]).toEqual({
        type: 'document',
        id: doc.id,
        name: 'Team Wiki',
      });
    } finally {
      await prisma.document.delete({ where: { id: doc.id } });
    }
  });

  it('GET /api/v1/me/preferences prunes soft-deleted documents from recentItemsByScope', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const active = await prisma.document.create({
      data: {
        title: 'Recent active',
        createdById: testUserId,
        draftBlocks: emptyBlockDocumentJson(),
      },
    });
    const trashed = await prisma.document.create({
      data: {
        title: 'Recent trashed',
        createdById: testUserId,
        draftBlocks: emptyBlockDocumentJson(),
        deletedAt: new Date(),
      },
    });
    const scopeKey = 'personal';
    await prisma.user.update({
      where: { id: testUserId },
      data: {
        preferences: {
          recentItemsByScope: {
            [scopeKey]: [
              { type: 'document', id: trashed.id, name: 'Recent trashed' },
              { type: 'document', id: active.id, name: 'Recent active' },
            ],
          },
        },
      },
    });

    try {
      const getRes = await app.inject({
        method: 'GET',
        url: '/api/v1/me/preferences',
        headers: { cookie },
      });
      expect(getRes.statusCode).toBe(200);
      type RecentItem = { type: string; id: string };
      const body = getRes.json() as { recentItemsByScope?: Record<string, RecentItem[]> };
      expect(body.recentItemsByScope?.[scopeKey]).toEqual([
        { type: 'document', id: active.id, name: 'Recent active' },
      ]);

      const stored = await prisma.user.findUniqueOrThrow({
        where: { id: testUserId },
        select: { preferences: true },
      });
      const prefs = stored.preferences as {
        recentItemsByScope?: Record<string, RecentItem[]>;
      } | null;
      expect(prefs?.recentItemsByScope?.[scopeKey]?.map((i) => i.id)).toEqual([active.id]);
    } finally {
      await prisma.document.deleteMany({ where: { id: { in: [active.id, trashed.id] } } });
    }
  });

  it('GET /api/v1/me/personal-documents includes context-free docs created by user', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const freeDoc = await prisma.document.create({
      data: {
        title: 'Personal free doc',
        createdById: testUserId,
        draftBlocks: emptyBlockDocumentJson(),
      },
    });

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/me/personal-documents?limit=50&offset=0',
        headers: { cookie },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        items: Array<{ id: string; contextId: string | null }>;
        total: number;
      };
      expect(body.items.some((d) => d.id === freeDoc.id && d.contextId == null)).toBe(true);
      expect(body.total).toBeGreaterThanOrEqual(1);
    } finally {
      await prisma.document.delete({ where: { id: freeDoc.id } });
    }
  });

  it('PATCH /api/v1/me/preferences → lastSeenReleaseVersion gespeichert und per GET geliefert', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/preferences',
      headers: { cookie },
      payload: { lastSeenReleaseVersion: '0.2.0' },
    });
    expect(patchRes.statusCode).toBe(200);
    expect((patchRes.json() as { lastSeenReleaseVersion?: string }).lastSeenReleaseVersion).toBe(
      '0.2.0'
    );

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/preferences',
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    expect((getRes.json() as { lastSeenReleaseVersion?: string }).lastSeenReleaseVersion).toBe(
      '0.2.0'
    );
  });
});
