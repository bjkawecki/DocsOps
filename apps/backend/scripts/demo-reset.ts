/**
 * Local demo reset: clear domain data, re-seed CSV, clear sessions, ensure admin.
 * Destructive – only for local/demo databases listed in DEV_DESTRUCTIVE_DB_NAMES.
 *
 * Usage (from apps/backend):
 *   DEMO_MODE=true DEV_DESTRUCTIVE_DB_NAMES=docsops \
 *     pnpm run demo:reset
 *
 * Or:
 *   ALLOW_PLATFORM_RESET=1 DEV_DESTRUCTIVE_DB_NAMES=docsops \
 *     pnpm run demo:reset
 */
import './load-env.js';
import { isDemoMode, isTruthyEnv } from '../src/config/runtimeMode.js';
import { prisma } from '../src/db.js';
import { hashPassword } from '../src/domains/auth/services/password.js';
import { resetPlatformDomainData } from '../src/domains/admin/services/resetPlatformDomainData.js';
import { reseedPlatformFromCsv } from '../src/seed.js';
import { initStorage } from '../src/infrastructure/storage/index.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() || 'admin@demo.docsops.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim() || 'DocsOps1';
const ADMIN_NAME = process.env.ADMIN_NAME?.trim() || 'Admin';

async function ensureAdmin(): Promise<void> {
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const existing = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL, deletedAt: null },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, isAdmin: true, name: ADMIN_NAME },
    });
    return;
  }
  await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      isAdmin: true,
    },
  });
}

async function main(): Promise<void> {
  const allow =
    isDemoMode() ||
    isTruthyEnv(process.env.ALLOW_PLATFORM_RESET) ||
    process.env.NODE_ENV === 'development';
  if (!allow) {
    throw new Error(
      'demo-reset requires DEMO_MODE=true, ALLOW_PLATFORM_RESET=1, or NODE_ENV=development'
    );
  }

  console.log('demo-reset: ensuring admin…');
  await ensureAdmin();

  const storage = await initStorage();
  console.log('demo-reset: resetting platform domain data…');
  const resetResult = await resetPlatformDomainData(prisma, storage);
  console.log('demo-reset: deleted non-admin users:', resetResult.deletedNonAdminUsers);

  console.log('demo-reset: reseeding from CSV…');
  await reseedPlatformFromCsv(prisma);

  console.log('demo-reset: clearing sessions…');
  const sessions = await prisma.session.deleteMany({});
  console.log('demo-reset: sessions deleted:', sessions.count);

  await ensureAdmin();
  console.log('demo-reset: done.');
}

main()
  .catch((err) => {
    console.error('demo-reset failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
