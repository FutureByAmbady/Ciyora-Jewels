import { getCurrentUser, hashPassword, verifyPassword, requireAuth } from '../../_shared/auth.js';
import { json, error, handleError, readJson } from '../../_shared/http.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireAuth(request, env, { mutate: true });
    const body = await readJson(request);
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    if (newPassword.length < 12) return error('New password must be at least 12 characters.', 400, 'weak_password');
    if (!(await verifyPassword(currentPassword, user.passwordHash, user.passwordSalt, user.passwordIterations))) return error('Current password is incorrect.', 400, 'invalid_current_password');
    const next = await hashPassword(newPassword);
    await env.DB.prepare('UPDATE admin_users SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(next.hash, next.salt, next.iterations, user.id).run();
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').bind(user.id, user.token).run();
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
