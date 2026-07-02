-- Trust Pack — homeowner-facing trust document + e-sign audit (D1/SQLite)
CREATE TABLE IF NOT EXISTS trustpacks (
  id           TEXT PRIMARY KEY,              -- e.g. TP-2026-4821 (also the public /tp/<id> slug)
  owner_email  TEXT NOT NULL,
  data         TEXT NOT NULL DEFAULT '{}',    -- JSON: {company, project, sections, scope[], milestones[], reviews[], ...}
  score        INTEGER DEFAULT 0,             -- Trust Score 0-100
  doc_sha256   TEXT,                          -- hash of the rendered content (binds signatures to a version)
  views        INTEGER DEFAULT 0,             -- read-receipt
  last_viewed_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tp_owner ON trustpacks(owner_email, created_at);

CREATE TABLE IF NOT EXISTS trustpack_signatures (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  pack_id      TEXT NOT NULL,
  doc_sha256   TEXT,                          -- the doc version they accepted
  signer_name  TEXT NOT NULL,
  signer_email TEXT,
  consent      INTEGER DEFAULT 1,             -- electronic-business consent
  verified_license INTEGER DEFAULT 0,         -- checked the CSLB box
  signed_at    TEXT NOT NULL DEFAULT (datetime('now')),
  ip           TEXT,
  user_agent   TEXT
);
CREATE INDEX IF NOT EXISTS idx_tps_pack ON trustpack_signatures(pack_id);
