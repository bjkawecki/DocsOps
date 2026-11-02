CREATE TABLE IF NOT EXISTS admin_notification_broadcast (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_kind TEXT NOT NULL,
  target_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_notification_broadcast_created_at_idx
  ON admin_notification_broadcast (created_at DESC);
