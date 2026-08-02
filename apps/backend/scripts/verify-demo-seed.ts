/**
 * Dev helper: reset domain data, re-seed CSV, verify demo accounts/passwords.
 * Destructive – only for local docsops DB. Not part of normal CI.
 *
 * Usage (from apps/backend):
 *   NODE_ENV=development ALLOW_PLATFORM_RESET=1 DEV_DESTRUCTIVE_DB_NAMES=docsops \
 *     pnpm exec tsx scripts/run-with-app-version.ts -- tsx scripts/verify-demo-seed.ts
 */
import './load-env.js';
import { prisma } from '../src/db.js';
import { verifyPassword, hashPassword } from '../src/domains/auth/services/password.js';
import { resetPlatformDomainData } from '../src/domains/admin/services/resetPlatformDomainData.js';
import { reseedPlatformFromCsv } from '../src/seed.js';

const ADMIN_EMAIL = 'admin@demo.docsops.local';
const PASSWORD = 'DocsOps1';

const EXPECTED_EMAILS = [
  'company.lead@demo.docsops.local',
  'department.lead@demo.docsops.local',
  'team.lead@demo.docsops.local',
  'member@demo.docsops.local',
];

async function ensureAdmin() {
  const existing = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL, deletedAt: null },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash: await hashPassword(PASSWORD), isAdmin: true, name: 'Admin' },
    });
    return;
  }
  await prisma.user.create({
    data: {
      name: 'Admin',
      email: ADMIN_EMAIL,
      passwordHash: await hashPassword(PASSWORD),
      isAdmin: true,
    },
  });
}

async function main() {
  await ensureAdmin();
  await resetPlatformDomainData(prisma, null);
  await reseedPlatformFromCsv(prisma);

  const companies = await prisma.company.findMany({ select: { name: true } });
  const departments = await prisma.department.findMany({ select: { name: true } });
  const teams = await prisma.team.findMany({ select: { name: true } });
  const docs = await prisma.document.count({ where: { deletedAt: null } });
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { email: true, passwordHash: true, isAdmin: true },
  });

  if (companies.length !== 1 || companies[0]?.name !== 'Nordlicht Software GmbH') {
    throw new Error(`Unexpected companies: ${JSON.stringify(companies)}`);
  }
  if (departments.length !== 1 || departments[0]?.name !== 'Produktentwicklung') {
    throw new Error(`Unexpected departments: ${JSON.stringify(departments)}`);
  }
  if (teams.length !== 1 || teams[0]?.name !== 'Barrierefreiheit') {
    throw new Error(`Unexpected teams: ${JSON.stringify(teams)}`);
  }
  if (docs < 6 || docs > 10) {
    throw new Error(`Unexpected document count: ${docs}`);
  }

  for (const email of EXPECTED_EMAILS) {
    const u = users.find((x) => x.email === email);
    if (!u?.passwordHash) throw new Error(`Missing user ${email}`);
    if (!(await verifyPassword(u.passwordHash, PASSWORD))) {
      throw new Error(`Password mismatch for ${email}`);
    }
  }
  const admin = users.find((x) => x.email === ADMIN_EMAIL && x.isAdmin);
  if (!admin?.passwordHash) throw new Error('Missing admin');
  if (!(await verifyPassword(admin.passwordHash, PASSWORD))) {
    throw new Error('Password mismatch for admin');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        companies: companies.length,
        departments: departments.length,
        teams: teams.length,
        documents: docs,
        users: users.length,
      },
      null,
      2
    )
  );
}

void main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
