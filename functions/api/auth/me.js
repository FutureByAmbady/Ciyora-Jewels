import { getCurrentUser, publicUser } from '../../_shared/auth.js';
import { json, error, handleError } from '../../_shared/http.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await getCurrentUser(request, env);
    return user ? json({ user: publicUser(user) }) : error('Not signed in.', 401, 'unauthorized');
  } catch (err) {
    return handleError(err);
  }
}
