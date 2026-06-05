CREATE TABLE IF NOT EXISTS regulations (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL,
  version     TEXT NOT NULL,
  latest_version TEXT,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT,
  status      TEXT NOT NULL DEFAULT 'up-to-date',
  severity    TEXT,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  published_update TEXT,
  gap_score   INTEGER DEFAULT 0,
  changes     JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS alerts (
  id          SERIAL PRIMARY KEY,
  reg_id      TEXT REFERENCES regulations(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  severity    TEXT NOT NULL,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS alerts_reg_id_idx ON alerts(reg_id);
CREATE INDEX IF NOT EXISTS alerts_created_idx ON alerts(created_at DESC);

ALTER TABLE regulations ADD COLUMN IF NOT EXISTS source_url TEXT;

CREATE TABLE IF NOT EXISTS news_items (
  id          SERIAL PRIMARY KEY,
  reg_id      TEXT REFERENCES regulations(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  source      TEXT,
  published_at TIMESTAMPTZ,
  fetched_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reg_id, url)
);
CREATE INDEX IF NOT EXISTS news_reg_id_idx ON news_items(reg_id);
CREATE INDEX IF NOT EXISTS news_published_idx ON news_items(published_at DESC);
