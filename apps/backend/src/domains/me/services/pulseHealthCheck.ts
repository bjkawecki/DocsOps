import type { PrismaClient } from '../../../../generated/prisma/client.js';
import {
  buildPulseItemId,
  coalesceLatestByOwnerScope,
  parseHealthCheckPulseScopeKey,
  payloadRecord,
  type PulseNotifRow,
} from './pulseCoalesce.js';
import { buildPulseBody } from './pulseTemplates.js';
import type { PulseScopeType } from './pulseDocumentMeta.js';

export type HealthCheckPulseItem = {
  id: string;
  kind: 'health-check-action-needed';
  title: string;
  body: string;
  href: string;
  occurredAt: string;
  documentId: string;
  meta: {
    scopeType: PulseScopeType;
    scopeName: string;
    count: number;
  };
};

async function resolveOwnerScopeNames(
  prisma: PrismaClient,
  scopeKeys: string[]
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const companyIds: string[] = [];
  const departmentIds: string[] = [];
  const teamIds: string[] = [];
  for (const key of scopeKeys) {
    const parsed = parseHealthCheckPulseScopeKey(key);
    if (!parsed) continue;
    if (parsed.scopeType === 'company') companyIds.push(parsed.scopeId);
    else if (parsed.scopeType === 'department') departmentIds.push(parsed.scopeId);
    else teamIds.push(parsed.scopeId);
  }
  const [companies, departments, teams] = await Promise.all([
    companyIds.length > 0
      ? prisma.company.findMany({
          where: { id: { in: [...new Set(companyIds)] } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    departmentIds.length > 0
      ? prisma.department.findMany({
          where: { id: { in: [...new Set(departmentIds)] } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    teamIds.length > 0
      ? prisma.team.findMany({
          where: { id: { in: [...new Set(teamIds)] } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);
  for (const row of companies) names.set(`company:${row.id}`, row.name);
  for (const row of departments) names.set(`department:${row.id}`, row.name);
  for (const row of teams) names.set(`team:${row.id}`, row.name);
  return names;
}

/** Build health-check pulse items (one per owner scope) from unread notifications. */
export async function buildHealthCheckPulseItems(args: {
  prisma: PrismaClient;
  rows: PulseNotifRow[];
  now: Date;
  inLast24h: (iso: string, now: Date) => boolean;
}): Promise<{
  items: HealthCheckPulseItem[];
  healthCheckActionNeeded: number;
  healthCheckActionNeededLast24h: number;
}> {
  const byScope = coalesceLatestByOwnerScope(args.rows);
  const names = await resolveOwnerScopeNames(args.prisma, [...byScope.keys()]);
  const items: HealthCheckPulseItem[] = [];
  let healthCheckActionNeededLast24h = 0;

  for (const [scopeKey, row] of byScope) {
    const parsed = parseHealthCheckPulseScopeKey(scopeKey);
    if (!parsed) continue;
    const payload = payloadRecord(row.payload);
    const count = typeof payload.count === 'number' ? payload.count : 0;
    const scopeName = names.get(scopeKey) ?? scopeKey;
    const occurredAt = row.created_at.toISOString();
    if (args.inLast24h(occurredAt, args.now)) healthCheckActionNeededLast24h += 1;
    items.push({
      id: buildPulseItemId('health-check-action-needed', scopeKey),
      kind: 'health-check-action-needed',
      title: scopeName,
      body: buildPulseBody({
        kind: 'health-check-action-needed',
        title: scopeName,
        scopeName,
        contextName: null,
        contextTypeLabel: null,
      }),
      href: '/freshness',
      occurredAt,
      documentId: scopeKey,
      meta: {
        scopeType: parsed.scopeType,
        scopeName,
        count,
      },
    });
  }

  return {
    items,
    healthCheckActionNeeded: byScope.size,
    healthCheckActionNeededLast24h,
  };
}
