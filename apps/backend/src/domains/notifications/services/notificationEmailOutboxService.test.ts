import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Prisma } from '../../../../generated/prisma/client.js';
import { prisma } from '../../../db.js';
import type * as adminSystemSettingsService from '../../admin/services/adminSystemSettingsService.js';
import { consumeNotificationEmailOutbox } from '../services/notificationEmailOutboxService.js';

const sendSmtpMail = vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined);
const getSmtpTransportConfig = vi.fn<(...args: unknown[]) => Promise<unknown>>();

vi.mock('../../../infrastructure/mail/smtpTransport.js', () => ({
  sendSmtpMail: (...args: unknown[]) => sendSmtpMail(...args) as Promise<void>,
}));

vi.mock('../../admin/services/adminSystemSettingsService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof adminSystemSettingsService>();
  return {
    ...actual,
    getSmtpTransportConfig: (...args: unknown[]) =>
      getSmtpTransportConfig(...args) as Promise<unknown>,
  };
});

describe('consumeNotificationEmailOutbox', () => {
  const ids: string[] = [];

  beforeEach(() => {
    sendSmtpMail.mockClear();
    getSmtpTransportConfig.mockReset();
    getSmtpTransportConfig.mockResolvedValue({
      host: 'smtp.example.com',
      port: 587,
      encryption: 'starttls',
      username: 'u',
      password: 'p',
      fromAddress: 'noreply@example.com',
      fromName: 'DocsOps',
    });
  });

  afterEach(async () => {
    for (const id of ids) {
      await prisma.$executeRaw(Prisma.sql`DELETE FROM notification_email_outbox WHERE id = ${id}`);
    }
    ids.length = 0;
  });

  it('sends via SMTP and marks outbox sent', async () => {
    const id = `outbox-test-${Date.now()}`;
    ids.push(id);
    const user = await prisma.user.findFirst({ select: { id: true } });
    expect(user).toBeTruthy();
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO notification_email_outbox (
        id, user_id, email, event_type, payload, status, queued_at
      ) VALUES (
        ${id},
        ${user!.id},
        'reader@example.com',
        'document-updated',
        '{}'::jsonb,
        'queued',
        NOW()
      )
    `);

    const result = await consumeNotificationEmailOutbox(prisma, { batchSize: 50 });
    expect(result.pickedCount).toBeGreaterThanOrEqual(1);
    expect(sendSmtpMail).toHaveBeenCalled();

    const rows = await prisma.$queryRaw<{ status: string }[]>(Prisma.sql`
      SELECT status FROM notification_email_outbox WHERE id = ${id}
    `);
    expect(rows[0]?.status).toBe('sent');
  });
});
