import { requireAuth } from '../../../_shared/auth.js';
import { normalizeCategoryInput, categoryFromRow, categoryStatements } from '../../../_shared/catalog.js';
import { json, error, handleError, readJson } from '../../../_shared/http.js';

export async function onRequestPost({ request, env }) {
  try {
    await requireAuth(request, env, { mutate: true });
    const category = normalizeCategoryInput(await readJson(request));
    const result = await categoryStatements(env.DB, category).run();
    const row = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(result.meta.last_row_id).first();
    return json({ category: categoryFromRow(row) }, 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    await requireAuth(request, env, { mutate: true });
    const category = normalizeCategoryInput(await readJson(request), { requireId: true });
    const existing = await env.DB.prepare('SELECT name FROM categories WHERE id = ?').bind(category.id).first();
    if (!existing) return error('Category was not found.', 404, 'not_found');
    await env.DB.batch([
      categoryStatements(env.DB, category, { update: true }),
      env.DB.prepare('UPDATE products SET category = ?, updated_at = datetime(\'now\') WHERE category = ?').bind(category.name, existing.name),
    ]);
    const row = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(category.id).first();
    return json({ category: categoryFromRow(row) });
  } catch (err) {
    return handleError(err);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    await requireAuth(request, env, { mutate: true });
    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id'));
    if (!Number.isInteger(id) || id <= 0) return error('A valid category id is required.', 400, 'invalid_category_id');
    const category = await env.DB.prepare('SELECT name FROM categories WHERE id = ?').bind(id).first();
    if (!category) return error('Category was not found.', 404, 'not_found');
    const usage = await env.DB.prepare('SELECT COUNT(*) AS count FROM products WHERE category = ?').bind(category.name).first();
    if (Number(usage?.count || 0) > 0) return error(`Move ${usage.count} product${Number(usage.count) === 1 ? '' : 's'} before deleting this category.`, 409, 'category_in_use');
    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
