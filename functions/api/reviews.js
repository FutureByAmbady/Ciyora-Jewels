import { normalizeReviewInput, reviewFromRow, recordActivity } from '../_shared/catalog.js';
import { json, error, handleError, readJson } from '../_shared/http.js';

export async function onRequestGet({ request, env }) {
  try {
    const id = Number(new URL(request.url).searchParams.get('product_id'));
    if (!Number.isInteger(id) || id <= 0) return error('A valid product id is required.', 400, 'invalid_product_id');
    const result = await env.DB.prepare(`SELECT r.*, p.name AS product_name FROM reviews r JOIN products p ON p.id = r.product_id WHERE r.product_id = ? AND r.status = 'approved' ORDER BY r.created_at DESC`).bind(id).all();
    const reviews = (result.results || []).map(reviewFromRow);
    const summary = reviews.reduce((acc, item) => ({ count: acc.count + 1, total: acc.total + item.rating }), { count: 0, total: 0 });
    return json({ reviews, count: summary.count, average: summary.count ? Number((summary.total / summary.count).toFixed(1)) : null });
  } catch (err) { return handleError(err); }
}

export async function onRequestPost({ request, env }) {
  try {
    const input = normalizeReviewInput(await readJson(request));
    const product = await env.DB.prepare('SELECT id, name FROM products WHERE id = ? AND status = \'published\' AND is_active = 1').bind(input.productId).first();
    if (!product) return error('Product is not available for review.', 404, 'product_not_found');
    const result = await env.DB.prepare('INSERT INTO reviews (product_id, name, rating, review, status) VALUES (?, ?, ?, ?, \'pending\')').bind(input.productId, input.name, input.rating, input.review).run();
    await recordActivity(env.DB, { eventType: 'review_submitted', message: `New review submitted for ${product.name}`, productId: input.productId });
    return json({ review: { id: Number(result.meta.last_row_id), status: 'pending' }, message: 'Thank you. Your review is awaiting approval.' }, 201);
  } catch (err) { return handleError(err); }
}
