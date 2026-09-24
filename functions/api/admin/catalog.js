import { requireAuth } from '../../_shared/auth.js';
import { readCatalog, normalizeProductInput, normalizeCategoryInput, productStatements, categoryStatements } from '../../_shared/catalog.js';
import { json, handleError, readJson } from '../../_shared/http.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireAuth(request, env);
    return json(await readCatalog(env.DB, { includeHidden: true }));
  } catch (err) {
    return handleError(err);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    await requireAuth(request, env, { mutate: true });
    const body = await readJson(request);
    const products = Array.isArray(body.products) ? body.products.map(product => normalizeProductInput(product)) : [];
    const categories = Array.isArray(body.categories) ? body.categories.map(category => normalizeCategoryInput(category)) : [];
    const settings = body.settings && typeof body.settings === 'object' ? body.settings : null;
    const statements = [env.DB.prepare('DELETE FROM products'), env.DB.prepare('DELETE FROM categories')];
    categories.forEach(category => statements.push(categoryStatements(env.DB, category)));
    products.forEach(product => statements.push(productStatements(env.DB, product)));
    if (settings) {
      statements.push(env.DB.prepare('INSERT INTO settings (id, business_name, email, instagram, whatsapp, updated_at) VALUES (1, ?, ?, ?, ?, datetime(\'now\')) ON CONFLICT(id) DO UPDATE SET business_name = excluded.business_name, email = excluded.email, instagram = excluded.instagram, whatsapp = excluded.whatsapp, updated_at = datetime(\'now\')').bind(String(settings.businessName || 'Ciyora Jewels').slice(0, 120), String(settings.email || '').slice(0, 180), String(settings.instagram || '').slice(0, 500), String(settings.whatsapp || '').slice(0, 80)));
    }
    await env.DB.batch(statements);
    return json(await readCatalog(env.DB, { includeHidden: true }));
  } catch (err) {
    return handleError(err);
  }
}
