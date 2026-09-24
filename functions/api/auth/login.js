import { verifyPassword, createSession, publicUser, SESSION_COOKIE } from '../../_shared/auth.js';
import { json, error, handleError, readJson, sessionCookie, assertSameOrigin } from '../../_shared/http.js';

export async function onRequestPost({ request, env }) {
  try {
    assertSameOrigin(request);
    const body = await readJson(request);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) return error('Email and password are required.', 400, 'missing_credentials');
    const user = await env.DB.prepare('SELECT * FROM admin_users WHERE email = ? AND is_active = 1').bind(email).first();
    if (!user || !(await verifyPassword(password, user.password_hash, user.password_salt, Number(user.password_iterations)))) {
      return error('Invalid email or password.', 401, 'invalid_credentials');
    }
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at <= datetime(\'now\') OR user_id = ?').bind(user.id).run();
    const session = await createSession(env.DB, user.id);
    return json({ user: publicUser({ id: Number(user.id), email: user.email, displayName: user.display_name }) }, 200, { 'Set-Cookie': sessionCookie(session.token, request) });
  } catch (err) {
    return handleError(err);
  }
}
