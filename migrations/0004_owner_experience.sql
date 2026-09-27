PRAGMA foreign_keys = ON;

ALTER TABLE settings ADD COLUMN logo_url TEXT NOT NULL DEFAULT '';
ALTER TABLE settings ADD COLUMN favicon_url TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS reviews_product_status_idx ON reviews(product_id, status, created_at);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK (event_type IN ('product_view','whatsapp_click','wishlist_add','wishlist_remove','search','category_view')),
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT '',
  search_term TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS analytics_events_product_idx ON analytics_events(product_id, event_type);

CREATE TABLE IF NOT EXISTS activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS activity_events_created_idx ON activity_events(created_at DESC);
