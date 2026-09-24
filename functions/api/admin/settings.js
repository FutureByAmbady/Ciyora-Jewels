import { requireAuth } from '../../_shared/auth.js';
import { settingsFromRow } from '../../_shared/catalog.js';
import { json, error, handleError, readJson } from '../../_shared/http.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireAuth(request, env);
    return json({ settings: settingsFromRow(await env.DB.prepare('SELECT * FROM settings WHERE id = 1').first()) });
  } catch (err) {
    return handleError(err);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    await requireAuth(request, env, { mutate: true });
    const body = await readJson(request);
    const settings = {
      businessName: String(body.businessName || 'Ciyora Jewels').trim().slice(0, 120),
      email: String(body.email || '').trim().slice(0, 180),
      instagram: String(body.instagram || '').trim().slice(0, 500),
      whatsapp: String(body.whatsapp || '').trim().slice(0, 80),
    };
    await env.DB.prepare('INSERT INTO settings (id, business_name, email, instagram, whatsapp, updated_at) VALUES (1, ?, ?, ?, ?, datetime(\'now\')) ON CONFLICT(id) DO UPDATE SET business_name = excluded.business_name, email = excluded.email, instagram = excluded.instagram, whatsapp = excluded.whatsapp, updated_at = datetime(\'now\')').bind(settings.businessName, settings.email, settings.instagram, settings.whatsapp).run();
    return json({ settings });
  } catch (err) {
    return handleError(err);
  }
}
