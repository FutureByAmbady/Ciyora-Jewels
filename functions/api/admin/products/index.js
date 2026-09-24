import { requireAuth } from '../../../_shared/auth.js';
import { normalizeProductInput, productFromRow, productStatements } from '../../../_shared/catalog.js';
import { json, error, handleError, readJson } from '../../../_shared/http.js';

export async function onRequestPost({ request, env }) {
  try {
    await requireAuth(request, env, { mutate: true });
    const product = normalizeProductInput(await readJson(request));
    const result = await productStatements(env.DB, product).run();
    const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(result.meta.last_row_id).first();
    return json({ product: productFromRow(row) }, 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    await requireAuth(request, env, { mutate: true });
    const product = normalizeProductInput(await readJson(request), { requireId: true });
    const result = await productStatements(env.DB, product, { update: true }).run();
    if (!result.meta.changes) return error('Product was not found.', 404, 'not_found');
    const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(product.id).first();
    return json({ product: productFromRow(row) });
  } catch (err) {
    return handleError(err);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    await requireAuth(request, env, { mutate: true });
    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id'));
    if (!Number.isInteger(id) || id <= 0) return error('A valid product id is required.', 400, 'invalid_product_id');
    const result = await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    if (!result.meta.changes) return error('Product was not found.', 404, 'not_found');
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
