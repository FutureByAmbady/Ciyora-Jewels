import { getCurrentUser, SESSION_COOKIE } from '../../_shared/auth.js';
import { json, handleError, clearedSessionCookie, assertSameOrigin } from '../../_shared/http.js';

export async function onRequestPost({ request, env }) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser(request, env);
    if (user) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(user.token).run();
    return json({ ok: true }, 200, { 'Set-Cookie': clearedSessionCookie(request) });
  } catch (err) {
    return handleError(err);
  }
}
