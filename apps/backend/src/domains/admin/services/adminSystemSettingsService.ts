import type { PrismaClient } from '../../../../generated/prisma/client.js';
import {
  decryptJson,
  encryptJson,
  isBackupEncryptionConfigured,
} from '../../../infrastructure/crypto/secretBox.js';
import {
  sendSmtpMail,
  type SmtpEncryption,
  type SmtpTransportConfig,
} from '../../../infrastructure/mail/smtpTransport.js';
import { isDemoMode } from '../../../config/runtimeMode.js';

export type SmtpEncryptionMode = SmtpEncryption;

export type SystemSettingsView = {
  updateCheckEnabled: boolean;
  smtpEnabled: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpEncryption: SmtpEncryptionMode | null;
  smtpUsername: string | null;
  smtpPasswordConfigured: boolean;
  smtpFromAddress: string | null;
  smtpFromName: string | null;
  updatedAt: Date;
};

export type PatchSystemSettingsInput = {
  updateCheckEnabled?: boolean;
  smtpEnabled?: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpEncryption?: SmtpEncryptionMode | null;
  smtpUsername?: string | null;
  /** When set, encrypts and stores; omit to keep existing password. */
  smtpPassword?: string | null;
  smtpFromAddress?: string | null;
  smtpFromName?: string | null;
};

const SMTP_SELECT = {
  updateCheckEnabled: true,
  smtpEnabled: true,
  smtpHost: true,
  smtpPort: true,
  smtpEncryption: true,
  smtpUsername: true,
  smtpPasswordCiphertext: true,
  smtpFromAddress: true,
  smtpFromName: true,
  updatedAt: true,
} as const;

function toView(row: {
  updateCheckEnabled: boolean;
  smtpEnabled: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpEncryption: string | null;
  smtpUsername: string | null;
  smtpPasswordCiphertext: string | null;
  smtpFromAddress: string | null;
  smtpFromName: string | null;
  updatedAt: Date;
}): SystemSettingsView {
  return {
    updateCheckEnabled: row.updateCheckEnabled,
    smtpEnabled: row.smtpEnabled,
    smtpHost: row.smtpHost,
    smtpPort: row.smtpPort,
    smtpEncryption: (row.smtpEncryption as SmtpEncryptionMode | null) ?? null,
    smtpUsername: row.smtpUsername,
    smtpPasswordConfigured:
      row.smtpPasswordCiphertext != null && row.smtpPasswordCiphertext.trim() !== '',
    smtpFromAddress: row.smtpFromAddress,
    smtpFromName: row.smtpFromName,
    updatedAt: row.updatedAt,
  };
}

const DEFAULT_VIEW: SystemSettingsView = {
  updateCheckEnabled: true,
  smtpEnabled: false,
  smtpHost: null,
  smtpPort: null,
  smtpEncryption: null,
  smtpUsername: null,
  smtpPasswordConfigured: false,
  smtpFromAddress: null,
  smtpFromName: null,
  updatedAt: new Date(),
};

export async function getSystemSettings(prisma: PrismaClient): Promise<SystemSettingsView> {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
    select: SMTP_SELECT,
  });
  return settings ? toView(settings) : { ...DEFAULT_VIEW, updatedAt: new Date() };
}

export class SmtpSettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmtpSettingsValidationError';
  }
}

export class DemoModeSmtpForbiddenError extends Error {
  constructor(message = 'SMTP is disabled in demo mode') {
    super(message);
    this.name = 'DemoModeSmtpForbiddenError';
  }
}

function assertSmtpPatchAllowed(data: PatchSystemSettingsInput): void {
  const touchesSmtp =
    data.smtpEnabled !== undefined ||
    data.smtpHost !== undefined ||
    data.smtpPort !== undefined ||
    data.smtpEncryption !== undefined ||
    data.smtpUsername !== undefined ||
    data.smtpPassword !== undefined ||
    data.smtpFromAddress !== undefined ||
    data.smtpFromName !== undefined;
  if (touchesSmtp && isDemoMode()) {
    throw new DemoModeSmtpForbiddenError();
  }
}

function validateEnabledSmtp(view: {
  smtpEnabled: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpEncryption: string | null;
  smtpFromAddress: string | null;
  smtpPasswordCiphertext: string | null;
}): void {
  if (!view.smtpEnabled) return;
  if (!view.smtpHost?.trim()) {
    throw new SmtpSettingsValidationError('SMTP host is required when SMTP is enabled');
  }
  if (view.smtpPort == null || view.smtpPort < 1 || view.smtpPort > 65535) {
    throw new SmtpSettingsValidationError('SMTP port is required when SMTP is enabled');
  }
  if (
    view.smtpEncryption !== 'none' &&
    view.smtpEncryption !== 'starttls' &&
    view.smtpEncryption !== 'tls'
  ) {
    throw new SmtpSettingsValidationError('SMTP encryption must be none, starttls, or tls');
  }
  if (!view.smtpFromAddress?.trim() || !view.smtpFromAddress.includes('@')) {
    throw new SmtpSettingsValidationError('SMTP from address is required when SMTP is enabled');
  }
  if (!view.smtpPasswordCiphertext?.trim()) {
    throw new SmtpSettingsValidationError('SMTP password is required when SMTP is enabled');
  }
  if (!isBackupEncryptionConfigured()) {
    throw new SmtpSettingsValidationError(
      'BACKUP_ENCRYPTION_KEY is required to store the SMTP password'
    );
  }
}

export async function updateSystemSettings(
  prisma: PrismaClient,
  data: PatchSystemSettingsInput
): Promise<SystemSettingsView> {
  assertSmtpPatchAllowed(data);

  const existing = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
    select: SMTP_SELECT,
  });

  let passwordCiphertext = existing?.smtpPasswordCiphertext ?? null;
  if (data.smtpPassword !== undefined) {
    if (data.smtpPassword === null || data.smtpPassword === '') {
      passwordCiphertext = null;
    } else {
      if (!isBackupEncryptionConfigured()) {
        throw new SmtpSettingsValidationError(
          'BACKUP_ENCRYPTION_KEY is required to store the SMTP password'
        );
      }
      passwordCiphertext = encryptJson({ password: data.smtpPassword });
    }
  }

  const nextEnabled = data.smtpEnabled ?? existing?.smtpEnabled ?? false;
  const nextHost = data.smtpHost !== undefined ? data.smtpHost : (existing?.smtpHost ?? null);
  const nextPort = data.smtpPort !== undefined ? data.smtpPort : (existing?.smtpPort ?? null);
  const nextEncryption =
    data.smtpEncryption !== undefined ? data.smtpEncryption : (existing?.smtpEncryption ?? null);
  const nextFrom =
    data.smtpFromAddress !== undefined ? data.smtpFromAddress : (existing?.smtpFromAddress ?? null);

  validateEnabledSmtp({
    smtpEnabled: nextEnabled,
    smtpHost: nextHost,
    smtpPort: nextPort,
    smtpEncryption: nextEncryption,
    smtpFromAddress: nextFrom,
    smtpPasswordCiphertext: passwordCiphertext,
  });

  const updated = await prisma.systemSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      updateCheckEnabled: data.updateCheckEnabled ?? true,
      smtpEnabled: nextEnabled,
      smtpHost: nextHost,
      smtpPort: nextPort,
      smtpEncryption: nextEncryption,
      smtpUsername: data.smtpUsername !== undefined ? data.smtpUsername : null,
      smtpPasswordCiphertext: passwordCiphertext,
      smtpFromAddress: nextFrom,
      smtpFromName: data.smtpFromName !== undefined ? data.smtpFromName : null,
    },
    update: {
      ...(data.updateCheckEnabled !== undefined
        ? { updateCheckEnabled: data.updateCheckEnabled }
        : {}),
      ...(data.smtpEnabled !== undefined ? { smtpEnabled: data.smtpEnabled } : {}),
      ...(data.smtpHost !== undefined ? { smtpHost: data.smtpHost } : {}),
      ...(data.smtpPort !== undefined ? { smtpPort: data.smtpPort } : {}),
      ...(data.smtpEncryption !== undefined ? { smtpEncryption: data.smtpEncryption } : {}),
      ...(data.smtpUsername !== undefined ? { smtpUsername: data.smtpUsername } : {}),
      ...(data.smtpPassword !== undefined ? { smtpPasswordCiphertext: passwordCiphertext } : {}),
      ...(data.smtpFromAddress !== undefined ? { smtpFromAddress: data.smtpFromAddress } : {}),
      ...(data.smtpFromName !== undefined ? { smtpFromName: data.smtpFromName } : {}),
    },
    select: SMTP_SELECT,
  });

  return toView(updated);
}

/**
 * Loads decrypted SMTP transport config when enabled and complete; otherwise null.
 */
export async function getSmtpTransportConfig(
  prisma: PrismaClient
): Promise<SmtpTransportConfig | null> {
  if (isDemoMode()) return null;

  const row = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
    select: SMTP_SELECT,
  });
  if (!row?.smtpEnabled) return null;
  if (
    !row.smtpHost?.trim() ||
    row.smtpPort == null ||
    !row.smtpFromAddress?.trim() ||
    !row.smtpPasswordCiphertext?.trim()
  ) {
    return null;
  }
  const encryption = row.smtpEncryption;
  if (encryption !== 'none' && encryption !== 'starttls' && encryption !== 'tls') {
    return null;
  }

  let password: string | null = null;
  try {
    const decrypted = decryptJson<{ password?: string }>(row.smtpPasswordCiphertext);
    password = typeof decrypted.password === 'string' ? decrypted.password : null;
  } catch {
    return null;
  }

  return {
    host: row.smtpHost.trim(),
    port: row.smtpPort,
    encryption,
    username: row.smtpUsername?.trim() || null,
    password,
    fromAddress: row.smtpFromAddress.trim(),
    fromName: row.smtpFromName?.trim() || null,
  };
}

export async function sendSmtpTestEmail(prisma: PrismaClient, to: string): Promise<void> {
  if (isDemoMode()) {
    throw new DemoModeSmtpForbiddenError();
  }
  const config = await getSmtpTransportConfig(prisma);
  if (!config) {
    throw new SmtpSettingsValidationError(
      'SMTP is not enabled or incomplete; save settings with a password first'
    );
  }
  const recipient = to.trim();
  if (!recipient.includes('@')) {
    throw new SmtpSettingsValidationError('Invalid test recipient email');
  }
  await sendSmtpMail(config, {
    to: recipient,
    subject: 'DocsOps SMTP test',
    text: 'This is a test email from DocsOps. SMTP is configured correctly.',
  });
}
