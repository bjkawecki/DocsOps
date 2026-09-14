import { Prisma, type PrismaClient } from '../../../../generated/prisma/client.js';
import { isDemoMode } from '../../../config/runtimeMode.js';
import {
  formatNotificationOutboxMail,
  resolveMailLocale,
  type MailLocale,
} from '../../../infrastructure/mail/mailI18n.js';
import { sendSmtpMail } from '../../../infrastructure/mail/smtpTransport.js';
import { getSmtpTransportConfig } from '../../admin/services/adminSystemSettingsService.js';

type OutboxRow = {
  id: string;
  user_id: string;
  email: string;
  event_type: string;
  payload: unknown;
};

export type NotificationEmailOutboxConsumeResult = {
  pickedCount: number;
  sentCount: number;
  failedCount: number;
};

async function loadRecipientLocales(
  prisma: PrismaClient,
  userIds: string[]
): Promise<Map<string, MailLocale>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, MailLocale>();
  if (unique.length === 0) return map;
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, preferences: true },
  });
  for (const user of users) {
    map.set(user.id, resolveMailLocale(user.preferences));
  }
  return map;
}

async function markOutboxSent(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.$executeRaw(Prisma.sql`
    UPDATE notification_email_outbox
    SET status = 'sent',
        sent_at = NOW(),
        error = NULL
    WHERE id = ${id}
  `);
}

async function markOutboxFailed(prisma: PrismaClient, id: string, error: string): Promise<void> {
  await prisma.$executeRaw(Prisma.sql`
    UPDATE notification_email_outbox
    SET status = 'failed',
        sent_at = NULL,
        error = ${error.slice(0, 2000)}
    WHERE id = ${id}
  `);
}

/**
 * Claims queued outbox rows and delivers via platform SMTP.
 * Skips delivery in DEMO_MODE or when SMTP is not configured (marks failed with reason).
 */
export async function consumeNotificationEmailOutbox(
  prisma: PrismaClient,
  args?: { batchSize?: number }
): Promise<NotificationEmailOutboxConsumeResult> {
  const batchSize = Math.max(1, Math.min(200, args?.batchSize ?? 20));
  let sentCount = 0;
  let failedCount = 0;

  const claimed = await prisma.$transaction(async (tx) => {
    return tx.$queryRaw<OutboxRow[]>(Prisma.sql`
      WITH cte AS (
        SELECT id
        FROM notification_email_outbox
        WHERE status = 'queued'
        ORDER BY queued_at ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE notification_email_outbox o
      SET status = 'sending'
      FROM cte
      WHERE o.id = cte.id
      RETURNING o.id, o.user_id, o.email, o.event_type, o.payload
    `);
  });

  if (claimed.length === 0) {
    return { pickedCount: 0, sentCount: 0, failedCount: 0 };
  }

  if (isDemoMode()) {
    for (const row of claimed) {
      await markOutboxFailed(prisma, row.id, 'Email delivery disabled in demo mode');
      failedCount += 1;
    }
    return { pickedCount: claimed.length, sentCount: 0, failedCount };
  }

  const config = await getSmtpTransportConfig(prisma);
  if (!config) {
    for (const row of claimed) {
      await markOutboxFailed(prisma, row.id, 'SMTP is not enabled or incomplete');
      failedCount += 1;
    }
    return { pickedCount: claimed.length, sentCount: 0, failedCount };
  }

  const localesByUserId = await loadRecipientLocales(
    prisma,
    claimed.map((row) => row.user_id)
  );

  for (const row of claimed) {
    const email = row.email?.trim() ?? '';
    if (!email.includes('@')) {
      await markOutboxFailed(prisma, row.id, 'Invalid recipient email address');
      failedCount += 1;
      continue;
    }
    try {
      const locale = localesByUserId.get(row.user_id) ?? 'en';
      const mail = formatNotificationOutboxMail(locale, row.event_type);
      await sendSmtpMail(config, { to: email, subject: mail.subject, text: mail.text });
      await markOutboxSent(prisma, row.id);
      sentCount += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SMTP send failed';
      await markOutboxFailed(prisma, row.id, message);
      failedCount += 1;
    }
  }

  return {
    pickedCount: claimed.length,
    sentCount,
    failedCount,
  };
}
