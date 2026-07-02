CREATE TABLE IF NOT EXISTS scorecard_leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL,
  company     TEXT,
  score       INTEGER,
  tier        TEXT,
  answers     TEXT,
  ip          TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sc_email ON scorecard_leads(email, created_at);
