CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,            -- PRJ-<hex>
  owner_email TEXT NOT NULL,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  archived    INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_prj_owner ON projects(owner_email, created_at);

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
