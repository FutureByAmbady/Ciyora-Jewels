const MAX_TEXT = 5000;
const MAX_IMAGE_URL = 2_000_000;

const text = (value, fallback = '') => String(value ?? fallback).trim().slice(0, MAX_TEXT);
const safeJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value || '');
    return parsed;
  } catch {
    return fallback;
  }
};

export function productFromRow(row) {
  const imgs = Array.isArray(safeJson(row.images_json, [])) ? safeJson(row.images_json, []) : [];
  const sizes = Array.isArray(safeJson(row.sizes_json, [])) ? safeJson(row.sizes_json, []) : ['One Size'];
  return {
    id: Number(row.id),
    name: row.name,
    cat: row.category,
    desc: row.description || '',
    price: row.price || 'Price on request',
    material: row.material || 'Not specified',
    color: row.color || 'Not specified',
    weight: row.weight || 'Not specified',
    sizes,
    badge: row.badge || '',
    status: row.status === 'hidden' ? 'hidden' : 'published',
    img: row.image || imgs[0] || '',
    imgs,
    whatsapp: row.whatsapp || '',
    instagram: row.instagram || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function categoryFromRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    count: Number(row.product_count || 0),
    icon: row.icon || 'folder',
  };
}

export function settingsFromRow(row) {
  return {
    businessName: row?.business_name || 'Ciyora Jewels',
    email: row?.email || '',
    instagram: row?.instagram || '',
    whatsapp: row?.whatsapp || '',
  };
}

export function normalizeProductInput(input, { requireId = false } = {}) {
  if (!input || typeof input !== 'object') throw Object.assign(new Error('Product data is required.'), { status: 400, code: 'invalid_product' });
  const id = Number(input.id);
  if (requireId && (!Number.isInteger(id) || id <= 0)) throw Object.assign(new Error('A valid product id is required.'), { status: 400, code: 'invalid_product_id' });
  const images = (Array.isArray(input.imgs) ? input.imgs : (input.img ? [input.img] : []))
    .map(item => text(item, '').slice(0, MAX_IMAGE_URL))
    .filter(Boolean)
    .slice(0, 8);
  const category = text(input.cat || input.category, 'Uncategorized').slice(0, 120);
  const name = text(input.name).slice(0, 180);
  if (!name || !category) throw Object.assign(new Error('Product name and category are required.'), { status: 400, code: 'invalid_product' });
  return {
    id: Number.isInteger(id) && id > 0 ? id : null,
    name,
    category,
    description: text(input.desc || input.description).slice(0, 2000),
    price: text(input.price, 'Price on request').slice(0, 80),
    material: text(input.material, 'Not specified').slice(0, 180),
    color: text(input.color, 'Not specified').slice(0, 80),
    weight: text(input.weight, 'Not specified').slice(0, 80),
    sizes: (Array.isArray(input.sizes) ? input.sizes : ['One Size']).map(item => text(item).slice(0, 40)).filter(Boolean).slice(0, 20),
    badge: text(input.badge).slice(0, 40),
    status: input.status === 'hidden' ? 'hidden' : 'published',
    image: text(input.img || images[0]).slice(0, MAX_IMAGE_URL),
    images,
    whatsapp: text(input.whatsapp).slice(0, 80),
    instagram: text(input.instagram).slice(0, 500),
  };
}

export function normalizeCategoryInput(input, { requireId = false } = {}) {
  if (!input || typeof input !== 'object') throw Object.assign(new Error('Category data is required.'), { status: 400, code: 'invalid_category' });
  const id = Number(input.id);
  if (requireId && (!Number.isInteger(id) || id <= 0)) throw Object.assign(new Error('A valid category id is required.'), { status: 400, code: 'invalid_category_id' });
  const name = text(input.name).slice(0, 120);
  if (!name) throw Object.assign(new Error('Category name is required.'), { status: 400, code: 'invalid_category' });
  return { id: Number.isInteger(id) && id > 0 ? id : null, name, icon: text(input.icon, 'folder').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'folder' };
}

export async function readCatalog(db, { includeHidden = false } = {}) {
  const productQuery = includeHidden
    ? 'SELECT * FROM products ORDER BY id DESC'
    : "SELECT * FROM products WHERE status = 'published' ORDER BY id DESC";
  const [productResult, categoryResult, settingsResult] = await Promise.all([
    db.prepare(productQuery).all(),
    db.prepare('SELECT c.*, COUNT(p.id) AS product_count FROM categories c LEFT JOIN products p ON p.category = c.name GROUP BY c.id ORDER BY c.id ASC').all(),
    db.prepare('SELECT * FROM settings WHERE id = 1').first(),
  ]);
  return {
    products: (productResult.results || []).map(productFromRow),
    categories: (categoryResult.results || []).map(categoryFromRow),
    settings: settingsFromRow(settingsResult),
  };
}

export function productStatements(db, product, { update = false } = {}) {
  const fields = [
    product.name, product.category, product.description, product.price, product.material,
    product.color, product.weight, JSON.stringify(product.sizes), product.badge, product.status,
    product.image, JSON.stringify(product.images), product.whatsapp, product.instagram,
  ];
  if (update) {
    return db.prepare(`UPDATE products SET name = ?, category = ?, description = ?, price = ?, material = ?, color = ?, weight = ?, sizes_json = ?, badge = ?, status = ?, image = ?, images_json = ?, whatsapp = ?, instagram = ?, updated_at = datetime('now') WHERE id = ?`).bind(...fields, product.id);
  }
  return db.prepare(`INSERT INTO products (name, category, description, price, material, color, weight, sizes_json, badge, status, image, images_json, whatsapp, instagram) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(...fields);
}

export function categoryStatements(db, category, { update = false } = {}) {
  if (update) return db.prepare('UPDATE categories SET name = ?, icon = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(category.name, category.icon, category.id);
  return db.prepare('INSERT INTO categories (name, icon) VALUES (?, ?)').bind(category.name, category.icon);
}
