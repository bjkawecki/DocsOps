ALTER TABLE admin_notification_broadcast
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS job_id TEXT NULL;

UPDATE admin_notification_broadcast
SET sent_at = created_at
WHERE sent_at IS NULL AND status = 'sent';

CREATE INDEX IF NOT EXISTS admin_notification_broadcast_status_scheduled_at_idx
  ON admin_notification_broadcast (status, scheduled_at)
  WHERE status = 'scheduled';
