PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  icon TEXT NOT NULL DEFAULT 'folder',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT 'Price on request',
  material TEXT NOT NULL DEFAULT 'Not specified',
  color TEXT NOT NULL DEFAULT 'Not specified',
  weight TEXT NOT NULL DEFAULT 'Not specified',
  sizes_json TEXT NOT NULL DEFAULT '["One Size"]',
  badge TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  image TEXT NOT NULL DEFAULT '',
  images_json TEXT NOT NULL DEFAULT '[]',
  whatsapp TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  business_name TEXT NOT NULL DEFAULT 'Ciyora Jewels',
  email TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL DEFAULT 'Ciyora Admin',
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 210000,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

INSERT OR IGNORE INTO categories (id, name, icon) VALUES
  (1, 'Rings', 'circle'),
  (2, 'Necklaces', 'link'),
  (3, 'Bracelets', 'watch'),
  (4, 'Earrings', 'sparkles'),
  (5, 'Bridal', 'heart'),
  (6, 'Temple Jewelry', 'landmark');

INSERT OR IGNORE INTO products (id, name, category, description, price, material, color, weight, sizes_json, badge, status, image, images_json) VALUES
  (1, 'Celestial Diamond Ring', 'Rings', 'A brilliant solitaire set in 18k white gold with a halo of micro-pavé diamonds.', '₹1,85,000', 'White Gold, Diamond', 'Silver', '4.2g', '["5","6","7","8","9"]', 'New', 'published', 'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/14c8cb2fa-6e95-46d9-9c9f-4c807e2777a2.png', '["https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/14c8cb2fa-6e95-46d9-9c9f-4c807e2777a2.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/17fdc4337-8cab-43c6-9705-e77670e3fe1e.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/11f368e12-1d5f-40ba-b208-953358693a61.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1330f2028-f2ae-4780-9f97-8f59d525472a.png"]'),
  (2, 'Eternal Gold Pendant', 'Necklaces', 'Handcrafted 22k gold pendant with intricate filigree work and diamond accents.', '₹95,000', '22k Gold, Diamond', 'Gold', '12.5g', '["16\\\"","18\\\"","20\\\""]', 'Featured', 'published', 'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1f031e101-027d-4883-9144-c22aff3ed931.png', '["https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1f031e101-027d-4883-9144-c22aff3ed931.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/19a763985-0e41-402c-b068-e7141841f002.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1dd062e31-5df0-4ddf-930b-fce5c4d10795.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1d6a045d1-efd8-4aa1-96f3-b5220e564fc6.png"]'),
  (3, 'Diamond Tennis Bracelet', 'Bracelets', 'Classic tennis bracelet with 24 round brilliant diamonds set in 18k gold.', '₹2,45,000', '18k Gold, Diamond', 'Gold', '8.3g', '["6.5\\\"","7\\\"","7.5\\\""]', 'New', 'published', 'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/110bd196a-fd16-4270-990e-51fbdb941c75.png', '["https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/110bd196a-fd16-4270-990e-51fbdb941c75.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/14c8cb2fa-6e95-46d9-9c9f-4c807e2777a2.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1dd062e31-5df0-4ddf-930b-fce5c4d10795.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1f031e101-027d-4883-9144-c22aff3ed931.png"]'),
  (4, 'Pearl Drop Earrings', 'Earrings', 'Elegant South Sea pearl drops surrounded by a halo of sparkling diamonds.', '₹1,25,000', 'Silver, Pearl, Diamond', 'White', '6.1g', '["One Size"]', '', 'published', 'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1bf43121f-d744-455a-a0cb-e08408204bee.png', '["https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1bf43121f-d744-455a-a0cb-e08408204bee.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/19a763985-0e41-402c-b068-e7141841f002.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/156bebaef-7df2-4a73-9725-509a2980c133.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1ea905458-2061-4325-84ee-f7f641e93d44.png"]'),
  (5, 'Royal Bridal Set', 'Bridal', 'Traditional temple jewelry bridal set with Lakshmi pendant and matching jhumkas.', '₹4,85,000', '22k Gold, Ruby', 'Gold', '85g', '["Adjustable"]', 'Bridal', 'published', 'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1023075f1-b736-442a-88f6-092ab8700e91.png', '["https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1023075f1-b736-442a-88f6-092ab8700e91.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1d6a045d1-efd8-4aa1-96f3-b5220e564fc6.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1f031e101-027d-4883-9144-c22aff3ed931.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1dd062e31-5df0-4ddf-930b-fce5c4d10795.png"]'),
  (6, 'Temple Goddess Necklace', 'Temple Jewelry', 'Antique-finish temple necklace featuring Goddess Lakshmi with ruby accents.', '₹3,25,000', '22k Gold, Ruby, Emerald', 'Gold', '62g', '["Adjustable"]', 'Heritage', 'hidden', 'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1d6a045d1-efd8-4aa1-96f3-b5220e564fc6.png', '["https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1d6a045d1-efd8-4aa1-96f3-b5220e564fc6.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1023075f1-b736-442a-88f6-092ab8700e91.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1f031e101-027d-4883-9144-c22aff3ed931.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1dd062e31-5df0-4ddf-930b-fce5c4d10795.png"]'),
  (7, 'Pearl Halo Necklace', 'Necklaces', 'South Sea pearl centerpiece surrounded by brilliant diamonds in a floral halo.', '₹1,65,000', 'Silver, Pearl, Diamond', 'White', '14.8g', '["16\\\"","18\\\"","20\\\""]', 'New', 'published', 'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/19a763985-0e41-402c-b068-e7141841f002.png', '["https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/19a763985-0e41-402c-b068-e7141841f002.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1f031e101-027d-4883-9144-c22aff3ed931.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1bf43121f-d744-455a-a0cb-e08408204bee.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1dd062e31-5df0-4ddf-930b-fce5c4d10795.png"]'),
  (8, 'Rose Gold Stack Rings', 'Rings', 'Set of three delicate rose gold rings with pavé diamonds, perfect for stacking.', '₹78,000', 'Rose Gold, Diamond', 'Rose Gold', '5.6g', '["5","6","7","8"]', 'Trending', 'hidden', 'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/11f368e12-1d5f-40ba-b208-953358693a61.png', '["https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/11f368e12-1d5f-40ba-b208-953358693a61.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/14c8cb2fa-6e95-46d9-9c9f-4c807e2777a2.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1330f2028-f2ae-4780-9f97-8f59d525472a.png","https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1dd062e31-5df0-4ddf-930b-fce5c4d10795.png"]');

INSERT OR IGNORE INTO settings (id, business_name, email, instagram, whatsapp) VALUES (1, 'Ciyora Jewels', 'hello@ciyorajewels.com', 'https://instagram.com/ciyorajewels', '+91 98765 43210');
