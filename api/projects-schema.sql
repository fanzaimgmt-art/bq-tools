CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,            -- PRJ-<hex>
  owner_email TEXT NOT NULL,
  name        TEXT NOT NULL,
  context     TEXT,                         -- saved project brief Tony uses for tailoring
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  archived    INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_prj_owner ON projects(owner_email, created_at);
-- For DBs created before the context column existed (ignore error if it already exists):
-- ALTER TABLE projects ADD COLUMN context TEXT;

-- Gift/credit code redemption ledger — atomic single-claim via PRIMARY KEY on code.
CREATE TABLE IF NOT EXISTS redeemed_codes (
  code       TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  redeemed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_email TEXT NOT NULL,
  project_id  TEXT,                         -- which project (nullable = global)
  type        TEXT,                         -- tony | quote | trust-pack | ig-analysis | render | ...
  title       TEXT,
  ref         TEXT,                         -- a link/id to open it
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_hist_owner ON history(owner_email, created_at);
CREATE INDEX IF NOT EXISTS idx_hist_proj ON history(project_id, created_at);
