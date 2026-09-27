import { recordAnalytics } from '../_shared/catalog.js';
import { json, error, handleError, readJson } from '../_shared/http.js';

const allowed = new Set(['product_view', 'whatsapp_click', 'wishlist_add', 'wishlist_remove', 'search', 'category_view']);

export async function onRequestPost({ request, env }) {
  try {
    const body = await readJson(request);
    const eventType = String(body?.eventType || body?.event_type || '');
    if (!allowed.has(eventType)) return error('Unsupported analytics event.', 400, 'invalid_event');
    const productId = Number(body?.productId || body?.product_id || 0);
    await recordAnalytics(env.DB, { eventType, productId: Number.isInteger(productId) && productId > 0 ? productId : null, category: body?.category, searchTerm: body?.searchTerm || body?.search_term });
    return json({ ok: true }, 202);
  } catch (err) { return handleError(err); }
}
