import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { isBackupEncryptionConfigured } from '../../../infrastructure/crypto/secretBox.js';
import {
  listAdminJobSchedules,
  removeAdminJobSchedule,
  upsertAdminJobSchedule,
} from './adminJobsScheduleService.js';
import { getBackupSettings } from './adminBackupDestinationService.js';

const DEFAULT_BACKUP_CRON = '0 3 * * *';
const DEFAULT_BACKUP_TZ = 'UTC';

export async function isBackupScheduleActive(): Promise<boolean> {
  try {
    const schedules = await listAdminJobSchedules();
    return schedules.items.some((s) => s.jobName === 'maintenance.backup');
  } catch {
    return false;
  }
}

export async function getAutoBackupConfigured(prisma: PrismaClient): Promise<boolean> {
  const settings = await prisma.backupSettings.findUnique({
    where: { id: 'default' },
    select: { autoBackupConfigured: true },
  });
  return settings?.autoBackupConfigured ?? false;
}

export async function markAutoBackupConfigured(prisma: PrismaClient): Promise<void> {
  await prisma.backupSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      autoBackupConfigured: true,
    },
    update: {
      autoBackupConfigured: true,
    },
  });
}

export async function updateBackupSchedule(
  prisma: PrismaClient,
  body: { enabled: boolean; cron?: string; tz?: string }
): Promise<{ enabled: boolean; cron: string | null; tz: string | null }> {
  if (!body.enabled) {
    await removeAdminJobSchedule('maintenance.backup');
    return { enabled: false, cron: null, tz: null };
  }

  if (!isBackupEncryptionConfigured()) {
    throw new Error('BACKUP_ENCRYPTION_KEY is not configured');
  }

  const settings = await getBackupSettings(prisma);
  if (!settings.defaultDestinationId) {
    throw new Error('Default backup destination is required for automatic backups');
  }

  const cron = body.cron?.trim() || DEFAULT_BACKUP_CRON;
  const tz = body.tz?.trim() || DEFAULT_BACKUP_TZ;

  await upsertAdminJobSchedule({
    jobType: 'maintenance.backup',
    cron,
    tz,
    payload: { mode: 'schedule' },
  });
  await markAutoBackupConfigured(prisma);

  return { enabled: true, cron, tz };
}

export async function assertBackupScheduleCronUpdateAllowed(
  prisma: PrismaClient
): Promise<{ error?: string; statusCode?: number }> {
  const configured = await getAutoBackupConfigured(prisma);
  if (!configured) {
    return {
      statusCode: 403,
      error: 'Configure automatic backups in the Backup tab first.',
    };
  }
  const active = await isBackupScheduleActive();
  if (!active) {
    return {
      statusCode: 403,
      error: 'Enable automatic backups in the Backup tab first.',
    };
  }
  return {};
}

export function assertBackupScheduleEnableDisableForbidden(): {
  error: string;
  statusCode: number;
} {
  return {
    statusCode: 403,
    error: 'Enable or disable automatic backups in the Backup tab.',
  };
}

export { DEFAULT_BACKUP_CRON, DEFAULT_BACKUP_TZ };
