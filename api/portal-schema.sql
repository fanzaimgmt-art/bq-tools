CREATE TABLE IF NOT EXISTS portal_jobs (
  id          TEXT PRIMARY KEY,            -- JOB-<32 hex>, 128-bit, public link gate
  owner_email TEXT NOT NULL,
  data        TEXT NOT NULL DEFAULT '{}',  -- {title, homeowner, address}
  views       INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pj_owner ON portal_jobs(owner_email, created_at);
CREATE TABLE IF NOT EXISTS portal_updates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id      TEXT NOT NULL,
  body        TEXT,
  photo       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pu_job ON portal_updates(job_id, created_at);
