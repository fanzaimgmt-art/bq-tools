-- Obra CRM — thin pipeline schema (D1 / SQLite). Multi-tenant by owner_email.
-- Scope is deliberately locked: contacts, deals(pipeline), tasks(follow-up), activities(log). Nothing more.

CREATE TABLE IF NOT EXISTS contacts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_email  TEXT NOT NULL,
  name         TEXT NOT NULL,
  company      TEXT,
  email        TEXT,
  phone        TEXT,
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  -- upsert key to avoid duplicates: one contact per (owner, email-or-phone)
  dedupe_key   TEXT
);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_dedupe ON contacts(owner_email, dedupe_key);

CREATE TABLE IF NOT EXISTS deals (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_email    TEXT NOT NULL,
  contact_id     INTEGER,
  title          TEXT NOT NULL,
  value          REAL NOT NULL DEFAULT 0,
  stage          TEXT NOT NULL DEFAULT 'new',   -- new | quoted | won | lost  (hard-coded enum)
  source         TEXT,                          -- e.g. 'contact_form', 'manual', 'client', 'job'
  expected_close TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);
CREATE INDEX IF NOT EXISTS idx_deals_owner_stage ON deals(owner_email, stage);

CREATE TABLE IF NOT EXISTS tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_email  TEXT NOT NULL,
  deal_id      INTEGER,
  title        TEXT NOT NULL,
  due_at       TEXT,
  done         INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (deal_id) REFERENCES deals(id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_due ON tasks(owner_email, done, due_at);

CREATE TABLE IF NOT EXISTS activities (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_email  TEXT NOT NULL,
  deal_id      INTEGER,
  type         TEXT NOT NULL DEFAULT 'note',   -- note | call | email | sms | stage_change
  body         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (deal_id) REFERENCES deals(id)
);
CREATE INDEX IF NOT EXISTS idx_activities_deal ON activities(deal_id, created_at);
