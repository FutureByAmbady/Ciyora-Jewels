const MAX_TEXT = 5000;
const MAX_IMAGE_URL = 2_000_000;

const text = (value, fallback = '') => String(value ?? fallback).trim().slice(0, MAX_TEXT);
const slugify = value => text(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);
const safeJson = (value, fallback) => {
  try { return JSON.parse(value || ''); } catch { return fallback; }
};
const numericPrice = value => {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};
const formatInr = value => {
  const raw = String(value ?? '').trim();
  const amount = numericPrice(raw);
  return amount > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount) : raw || 'Price on request';
};

export function productFromRow(row) {
  const imgs = Array.isArray(safeJson(row.images_json, [])) ? safeJson(row.images_json, []) : [];
  const sizes = Array.isArray(safeJson(row.sizes_json, [])) ? safeJson(row.sizes_json, []) : ['One Size'];
  return {
    id: Number(row.id), name: row.name, slug: row.slug || slugify(row.name), sku: row.sku || '',
    cat: row.category, desc: row.description || '', shortDescription: row.short_description || row.description || '',
    price: formatInr(row.price_amount || row.price), compareAtPrice: row.compare_at_price ? formatInr(row.compare_at_price) : '', priceAmount: Number(row.price_amount || numericPrice(row.price)),
    material: row.material || 'Not specified', stone: row.stone || '', dimensions: row.dimensions || '', color: row.color || 'Not specified', weight: row.weight || 'Not specified',
    sizes, badge: row.badge || '', status: row.status === 'hidden' ? 'hidden' : 'published', active: Number(row.is_active ?? 1) === 1,
    stockQuantity: Number(row.stock_quantity || 0), stockStatus: row.stock_status || (Number(row.stock_quantity || 0) > 0 ? 'in_stock' : 'out_of_stock'),
    featured: Number(row.is_featured || 0) === 1, newArrival: Number(row.is_new_arrival || 0) === 1,
    img: row.image || imgs[0] || '', imgs, whatsapp: row.whatsapp || '', instagram: row.instagram || '',
    careInstructions: row.care_instructions || '', shippingInformation: row.shipping_information || '', returnInformation: row.return_information || '',
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export function categoryFromRow(row) {
  return { id: Number(row.id), name: row.name, slug: row.slug || slugify(row.name), description: row.description || '', image: row.image || '', count: Number(row.product_count || 0), icon: row.icon || 'folder', displayOrder: Number(row.display_order || 0), active: Number(row.is_active ?? 1) === 1, featured: Number(row.is_featured || 0) === 1 };
}

export function settingsFromRow(row) {
  return {
    businessName: row?.business_name || 'Ciyora Jewels',
    email: row?.email || '',
    instagram: row?.instagram || '',
    whatsapp: row?.whatsapp || '',
    logo: row?.logo_url || '',
    favicon: row?.favicon_url || '',
  };
}

export function normalizeWhatsapp(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  while (digits.startsWith('9191') && digits.length > 12) digits = digits.slice(2);
  if (digits.length === 10) digits = `91${digits}`;
  return digits.slice(0, 20);
}

export function recordActivity(db, { eventType, message, productId = null, categoryId = null }) {
  return db.prepare('INSERT INTO activity_events (event_type, message, product_id, category_id) VALUES (?,?,?,?)').bind(String(eventType).slice(0, 80), String(message).slice(0, 500), productId, categoryId).run();
}

export function recordAnalytics(db, { eventType, productId = null, category = '', searchTerm = '' }) {
  return db.prepare('INSERT INTO analytics_events (event_type, product_id, category, search_term) VALUES (?, ?, ?, ?)').bind(eventType, productId, String(category || '').slice(0, 120), String(searchTerm || '').slice(0, 120)).run();
}

export function reviewFromRow(row) {
  return { id: Number(row.id), productId: Number(row.product_id), productName: row.product_name || '', name: row.name, rating: Number(row.rating), review: row.review, status: row.status, createdAt: row.created_at };
}

export function normalizeReviewInput(input) {
  const productId = Number(input?.productId ?? input?.product_id);
  const name = text(input?.name).slice(0, 80);
  const review = text(input?.review).slice(0, 1500);
  const rating = Math.floor(Number(input?.rating));
  if (!Number.isInteger(productId) || productId <= 0) throw Object.assign(new Error('A valid product is required.'), { status: 400, code: 'invalid_product_id' });
  if (!name || name.length < 2) throw Object.assign(new Error('Please enter your name.'), { status: 400, code: 'invalid_review_name' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw Object.assign(new Error('Rating must be between 1 and 5.'), { status: 400, code: 'invalid_rating' });
  if (!review || review.length < 10) throw Object.assign(new Error('Review must be at least 10 characters.'), { status: 400, code: 'invalid_review' });
  return { productId, name, rating, review };
}

export function normalizeProductInput(input, { requireId = false } = {}) {
  if (!input || typeof input !== 'object') throw Object.assign(new Error('Product data is required.'), { status: 400, code: 'invalid_product' });
  const id = Number(input.id);
  if (requireId && (!Number.isInteger(id) || id <= 0)) throw Object.assign(new Error('A valid product id is required.'), { status: 400, code: 'invalid_product_id' });
  const images = (Array.isArray(input.imgs) ? input.imgs : (input.img ? [input.img] : [])).map(item => text(item, '').slice(0, MAX_IMAGE_URL)).filter(Boolean).slice(0, 10);
  const category = text(input.cat || input.category, 'Uncategorized').slice(0, 120);
  const name = text(input.name).slice(0, 180);
  if (!name || !category) throw Object.assign(new Error('Product name and category are required.'), { status: 400, code: 'invalid_product' });
  const stockQuantity = Math.max(0, Math.floor(Number(input.stockQuantity ?? input.stock_quantity ?? 0) || 0));
  const requestedStatus = input.status === 'hidden' ? 'hidden' : 'published';
  return {
    id: Number.isInteger(id) && id > 0 ? id : null, name, slug: slugify(input.slug || name), sku: text(input.sku).slice(0, 80), category,
    description: text(input.desc || input.description).slice(0, 2000), shortDescription: text(input.shortDescription || input.short_description || input.desc || input.description).slice(0, 500),
    price: formatInr(input.priceAmount ?? input.price), compareAtPrice: (input.compareAtPrice || input.compare_at_price) ? formatInr(input.compareAtPrice || input.compare_at_price) : '', priceAmount: numericPrice(input.priceAmount ?? input.price),
    material: text(input.material, 'Not specified').slice(0, 180), stone: text(input.stone).slice(0, 180), dimensions: text(input.dimensions).slice(0, 180), color: text(input.color, 'Not specified').slice(0, 80), weight: text(input.weight, 'Not specified').slice(0, 80),
    sizes: (Array.isArray(input.sizes) ? input.sizes : ['One Size']).map(item => text(item).slice(0, 40)).filter(Boolean).slice(0, 20), badge: text(input.badge).slice(0, 40),
    status: requestedStatus, active: input.active === false || input.is_active === 0 ? 0 : 1, stockQuantity,
    stockStatus: stockQuantity <= 0 ? 'out_of_stock' : stockQuantity < 5 ? 'low_stock' : 'in_stock',
    featured: input.featured === true || input.is_featured === 1 || input.badge === 'Featured' ? 1 : 0,
    newArrival: input.newArrival === true || input.is_new_arrival === 1 || input.badge === 'New' ? 1 : 0,
    image: text(input.img || images[0]).slice(0, MAX_IMAGE_URL), images,
    whatsapp: text(input.whatsapp).slice(0, 80), instagram: text(input.instagram).slice(0, 500),
    careInstructions: text(input.careInstructions || input.care_instructions).slice(0, 2000), shippingInformation: text(input.shippingInformation || input.shipping_information).slice(0, 2000), returnInformation: text(input.returnInformation || input.return_information).slice(0, 2000),
  };
}

export function normalizeCategoryInput(input, { requireId = false } = {}) {
  if (!input || typeof input !== 'object') throw Object.assign(new Error('Category data is required.'), { status: 400, code: 'invalid_category' });
  const id = Number(input.id); if (requireId && (!Number.isInteger(id) || id <= 0)) throw Object.assign(new Error('A valid category id is required.'), { status: 400, code: 'invalid_category_id' });
  const name = text(input.name).slice(0, 120); if (!name) throw Object.assign(new Error('Category name is required.'), { status: 400, code: 'invalid_category' });
  return { id: Number.isInteger(id) && id > 0 ? id : null, name, slug: slugify(input.slug || name), description: text(input.description).slice(0, 1000), image: text(input.image).slice(0, MAX_IMAGE_URL), icon: text(input.icon, 'folder').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'folder', displayOrder: Math.max(0, Math.floor(Number(input.displayOrder ?? input.display_order ?? 0) || 0)), active: input.active === false || input.is_active === 0 ? 0 : 1, featured: input.featured === true || input.is_featured === 1 ? 1 : 0 };
}

export async function readCatalog(db, { includeHidden = false, query = {} } = {}) {
  const args = [];
  const where = includeHidden ? ['1=1'] : ["p.status = 'published'", 'p.is_active = 1'];
  const q = text(query.q || query.search);
  if (q) { where.push('(p.name LIKE ? OR p.sku LIKE ? OR p.category LIKE ? OR p.material LIKE ? OR p.description LIKE ?)'); args.push(...Array(5).fill(`%${q}%`)); }
  if (query.category) { where.push('(c.slug = ? OR p.category = ?)'); args.push(text(query.category), text(query.category)); }
  if (query.slug) { where.push('p.slug = ?'); args.push(text(query.slug)); }
  if (query.material) { where.push('p.material LIKE ?'); args.push(`%${text(query.material)}%`); }
  if (query.featured === '1' || query.featured === 'true') where.push('p.is_featured = 1');
  if (query.newArrival === '1' || query.newArrival === 'true') where.push('p.is_new_arrival = 1');
  if (query.available === '1' || query.available === 'true') where.push('p.stock_quantity > 0');
  const sortMap = { price_asc: 'p.price_amount ASC', price_desc: 'p.price_amount DESC', name: 'p.name COLLATE NOCASE ASC', featured: 'p.is_featured DESC, p.created_at DESC', newest: 'p.created_at DESC' };
  const order = sortMap[text(query.sort)] || 'p.created_at DESC, p.id DESC';
  const productSql = `SELECT p.* FROM products p LEFT JOIN categories c ON c.name = p.category WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT 100`;
  const categoryWhere = includeHidden ? '1=1' : 'c.is_active = 1';
  const [productResult, categoryResult, settingsResult] = await Promise.all([
    db.prepare(productSql).bind(...args).all(),
    db.prepare(`SELECT c.*, COUNT(CASE WHEN p.status = 'published' AND p.is_active = 1 THEN p.id END) AS product_count FROM categories c LEFT JOIN products p ON p.category = c.name WHERE ${categoryWhere} GROUP BY c.id ORDER BY c.display_order ASC, c.id ASC`).all(),
    db.prepare('SELECT * FROM settings WHERE id = 1').first(),
  ]);
  return { products: (productResult.results || []).map(productFromRow), categories: (categoryResult.results || []).map(categoryFromRow), settings: settingsFromRow(settingsResult) };
}

export function productStatements(db, product, { update = false } = {}) {
  const fields = [product.name, product.slug, product.sku, product.category, product.description, product.shortDescription, product.price, product.compareAtPrice, product.priceAmount, product.material, product.stone, product.dimensions, product.color, product.weight, JSON.stringify(product.sizes), product.badge, product.status, product.image, JSON.stringify(product.images), product.whatsapp, product.instagram, product.stockQuantity, product.stockStatus, product.active, product.featured, product.newArrival, product.careInstructions, product.shippingInformation, product.returnInformation];
  if (update) return db.prepare(`UPDATE products SET name=?, slug=?, sku=?, category=?, description=?, short_description=?, price=?, compare_at_price=?, price_amount=?, material=?, stone=?, dimensions=?, color=?, weight=?, sizes_json=?, badge=?, status=?, image=?, images_json=?, whatsapp=?, instagram=?, stock_quantity=?, stock_status=?, is_active=?, is_featured=?, is_new_arrival=?, care_instructions=?, shipping_information=?, return_information=?, updated_at=datetime('now') WHERE id=?`).bind(...fields, product.id);
  return db.prepare(`INSERT INTO products (name,slug,sku,category,description,short_description,price,compare_at_price,price_amount,material,stone,dimensions,color,weight,sizes_json,badge,status,image,images_json,whatsapp,instagram,stock_quantity,stock_status,is_active,is_featured,is_new_arrival,care_instructions,shipping_information,return_information) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(...fields);
}

export function categoryStatements(db, category, { update = false } = {}) {
  if (update) return db.prepare(`UPDATE categories SET name=?, slug=?, description=?, image=?, icon=?, display_order=?, is_active=?, is_featured=?, updated_at=datetime('now') WHERE id=?`).bind(category.name, category.slug, category.description, category.image, category.icon, category.displayOrder, category.active, category.featured, category.id);
  return db.prepare(`INSERT INTO categories (name,slug,description,image,icon,display_order,is_active,is_featured) VALUES (?,?,?,?,?,?,?,?)`).bind(category.name, category.slug, category.description, category.image, category.icon, category.displayOrder, category.active, category.featured);
}
