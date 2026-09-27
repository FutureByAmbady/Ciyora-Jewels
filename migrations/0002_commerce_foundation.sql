PRAGMA foreign_keys = ON;

ALTER TABLE categories ADD COLUMN slug TEXT NOT NULL DEFAULT '';
ALTER TABLE categories ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE categories ADD COLUMN image TEXT NOT NULL DEFAULT '';
ALTER TABLE categories ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE categories ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0;

ALTER TABLE products ADD COLUMN slug TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN sku TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN short_description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN compare_at_price TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN price_amount REAL NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock','low_stock','out_of_stock'));
ALTER TABLE products ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN is_new_arrival INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN care_instructions TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN shipping_information TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN return_information TEXT NOT NULL DEFAULT '';

UPDATE categories SET slug = lower(replace(replace(name, ' ', '-'), '''', '')), display_order = id WHERE slug = '';
UPDATE products SET slug = lower(trim(replace(replace(replace(name, ' ', '-'), '''', ''), '—', '-'))), short_description = description, price_amount = CAST(replace(replace(replace(price, '₹', ''), ',', ''), ' ', '') AS REAL), is_new_arrival = CASE WHEN badge = 'New' THEN 1 ELSE 0 END, is_featured = CASE WHEN badge = 'Featured' THEN 1 ELSE 0 END WHERE slug = '';
UPDATE products SET stock_status = CASE WHEN stock_quantity <= 0 THEN 'out_of_stock' ELSE stock_status END;

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_idx ON categories(slug);
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON products(slug);
CREATE INDEX IF NOT EXISTS products_active_status_idx ON products(is_active, status);
CREATE INDEX IF NOT EXISTS products_new_idx ON products(is_new_arrival, created_at);
CREATE INDEX IF NOT EXISTS products_featured_idx ON products(is_featured, created_at);
CREATE INDEX IF NOT EXISTS products_price_idx ON products(price_amount);
