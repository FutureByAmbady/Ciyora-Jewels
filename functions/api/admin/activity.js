import { requireAuth } from '../../_shared/auth.js';
import { json, handleError } from '../../_shared/http.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireAuth(request, env);
    const result = await env.DB.prepare(`SELECT id, event_type AS eventType, message, product_id AS productId, category_id AS categoryId, created_at AS createdAt FROM activity_events ORDER BY id DESC LIMIT 100`).all();
    return json({ activity: result.results || [] });
  } catch (err) { return handleError(err); }
}
