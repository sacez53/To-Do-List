PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  device_key_hash TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  subscription TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'fr',
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS subscriptions_owner ON subscriptions(owner_id);
CREATE TABLE IF NOT EXISTS reminders (
  owner_id TEXT NOT NULL,
  reminder_key TEXT NOT NULL,
  task_id TEXT NOT NULL,
  due_at INTEGER NOT NULL,
  PRIMARY KEY(owner_id, reminder_key)
);
CREATE INDEX IF NOT EXISTS reminders_due ON reminders(due_at);
CREATE TABLE IF NOT EXISTS deliveries (
  owner_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  reminder_key TEXT NOT NULL,
  lease_until INTEGER NOT NULL DEFAULT 0,
  retry_at INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  delivered_at INTEGER,
  PRIMARY KEY(owner_id, subscription_id, reminder_key)
);
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  window INTEGER NOT NULL,
  count INTEGER NOT NULL
);
