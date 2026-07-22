/**
 * Seed script: loads dummy data from CSV files if the database has no company yet.
 * Called on app startup or can be run standalone via pnpm run seed.
 */
import type { PrismaClient } from '../generated/prisma/client.js';
import { shouldRunStartupSeed } from './config/runtimeMode.js';
import { loadSeedCsvData } from './seed/csv.js';
import { seedMasterData } from './seed/master-data.js';
import { seedOwners } from './seed/owners.js';
import { seedContexts } from './seed/contexts.js';
import { seedTags } from './seed/tags.js';
import { seedDocuments } from './seed/documents.js';
import { seedHomeDemoNotifications } from './seed/notifications.js';

export async function runSeedFromCsvFiles(prisma: PrismaClient): Promise<void> {
  const csv = loadSeedCsvData();
  if (csv.companies.length === 0) {
    throw new Error('No seed CSV data found');
  }

  const masterData = await seedMasterData(prisma, csv);
  const ownerData = await seedOwners(prisma, masterData);
  const contextData = await seedContexts(prisma, masterData, ownerData);
  const tagByNameAndOwner = await seedTags(prisma, masterData, ownerData);
  await seedDocuments(prisma, contextData, tagByNameAndOwner);
  await seedHomeDemoNotifications(prisma);
}

export async function runSeedIfEmpty(prisma: PrismaClient): Promise<boolean> {
  const existing = await prisma.company.count();
  if (existing > 0) return false;

  await runSeedFromCsvFiles(prisma);
  return true;
}

/**
 * Load CSV seed data into an empty database (after reset). Fails if companies already exist.
 */
export async function reseedPlatformFromCsv(prisma: PrismaClient): Promise<{ seeded: true }> {
  const existing = await prisma.company.count();
  if (existing > 0) {
    throw new Error('Database is not empty. Reset platform data first, then re-seed from CSV.');
  }

  await runSeedFromCsvFiles(prisma);
  return { seeded: true };
}

export async function runSeedIfNeeded(prisma: PrismaClient): Promise<void> {
  if (!shouldRunStartupSeed()) return;
  await runSeedIfEmpty(prisma);
}
