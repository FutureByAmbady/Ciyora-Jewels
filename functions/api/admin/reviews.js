import { requireAuth } from '../../_shared/auth.js';
import { reviewFromRow, recordActivity } from '../../_shared/catalog.js';
import { json, error, handleError, readJson } from '../../_shared/http.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireAuth(request, env);
    const status = new URL(request.url).searchParams.get('status');
    const where = status && ['pending', 'approved', 'rejected'].includes(status) ? 'WHERE r.status = ?' : '';
    const stmt = env.DB.prepare(`SELECT r.*, p.name AS product_name FROM reviews r JOIN products p ON p.id = r.product_id ${where} ORDER BY r.created_at DESC LIMIT 200`);
    const result = await (where ? stmt.bind(status) : stmt).all();
    return json({ reviews: (result.results || []).map(reviewFromRow) });
  } catch (err) { return handleError(err); }
}

export async function onRequestPut({ request, env }) {
  try {
    await requireAuth(request, env, { mutate: true });
    const body = await readJson(request);
    const id = Number(body?.id);
    const status = String(body?.status || '');
    if (!Number.isInteger(id) || id <= 0 || !['pending', 'approved', 'rejected'].includes(status)) return error('A valid review and status are required.', 400, 'invalid_review');
    const review = await env.DB.prepare('SELECT id, product_id, name FROM reviews WHERE id = ?').bind(id).first();
    if (!review) return error('Review was not found.', 404, 'not_found');
    await env.DB.prepare('UPDATE reviews SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(status, id).run();
    await recordActivity(env.DB, { eventType: `review_${status}`, message: `Review by ${review.name} marked ${status}`, productId: review.product_id });
    return json({ ok: true });
  } catch (err) { return handleError(err); }
}

export async function onRequestDelete({ request, env }) {
  try {
    await requireAuth(request, env, { mutate: true });
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isInteger(id) || id <= 0) return error('A valid review id is required.', 400, 'invalid_review_id');
    await env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run();
    return json({ ok: true });
  } catch (err) { return handleError(err); }
}
