import { requireAuth } from '../../_shared/auth.js';
import { json, handleError } from '../../_shared/http.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireAuth(request, env);
    const [views, wishlisted, enquiries, categories, searches, activity, pending] = await Promise.all([
      env.DB.prepare(`SELECT p.id, p.name, COUNT(*) AS count FROM analytics_events e JOIN products p ON p.id=e.product_id WHERE e.event_type='product_view' GROUP BY p.id ORDER BY count DESC LIMIT 10`).all(),
      env.DB.prepare(`SELECT p.id, p.name, COUNT(*) AS count FROM analytics_events e JOIN products p ON p.id=e.product_id WHERE e.event_type='wishlist_add' GROUP BY p.id ORDER BY count DESC LIMIT 10`).all(),
      env.DB.prepare(`SELECT p.id, p.name, COUNT(*) AS count FROM analytics_events e JOIN products p ON p.id=e.product_id WHERE e.event_type='whatsapp_click' GROUP BY p.id ORDER BY count DESC LIMIT 10`).all(),
      env.DB.prepare(`SELECT category, COUNT(*) AS count FROM analytics_events WHERE event_type='category_view' AND category != '' GROUP BY category ORDER BY count DESC LIMIT 10`).all(),
      env.DB.prepare(`SELECT search_term, COUNT(*) AS count FROM analytics_events WHERE event_type='search' AND search_term != '' GROUP BY search_term ORDER BY count DESC LIMIT 10`).all(),
      env.DB.prepare(`SELECT id, event_type AS eventType, message, product_id AS productId, category_id AS categoryId, created_at AS createdAt FROM activity_events ORDER BY id DESC LIMIT 30`).all(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM reviews WHERE status='pending'`).first(),
    ]);
    return json({ views: views.results || [], wishlisted: wishlisted.results || [], enquiries: enquiries.results || [], categories: categories.results || [], searches: searches.results || [], activity: activity.results || [], pendingReviews: Number(pending?.count || 0) });
  } catch (err) { return handleError(err); }
}
