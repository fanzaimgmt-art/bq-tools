CREATE TABLE IF NOT EXISTS connections (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_email   TEXT NOT NULL,
  provider      TEXT NOT NULL,          -- google | dropbox
  access_token  TEXT,
  refresh_token TEXT,
  expires_at    TEXT,
  scope         TEXT,
  connected_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(owner_email, provider)
);
CREATE INDEX IF NOT EXISTS idx_conn_owner ON connections(owner_email);
