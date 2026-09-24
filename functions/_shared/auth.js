import { getCookie, assertSameOrigin } from './http.js';

const SESSION_COOKIE = 'ciyora_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PBKDF2_ITERATIONS = 210000;

function bytesToHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a[i] ^ b[i];
  return result === 0;
}

export async function hashPassword(password, saltHex = null, iterations = PBKDF2_ITERATIONS) {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
  return { hash: bytesToHex(new Uint8Array(bits)), salt: bytesToHex(salt), iterations };
}

export async function verifyPassword(password, storedHash, salt, iterations = PBKDF2_ITERATIONS) {
  const result = await hashPassword(password, salt, iterations);
  return safeEqual(hexToBytes(result.hash), hexToBytes(storedHash));
}

export async function createSession(db, userId) {
  const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString().slice(0, 19).replace('T', ' ');
  await db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, userId, expiresAt).run();
  return { token, expiresAt };
}

export async function getCurrentUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const row = await env.DB.prepare(`SELECT u.id, u.email, u.display_name, u.password_hash, u.password_salt, u.password_iterations, s.token, s.expires_at
    FROM sessions s JOIN admin_users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(token).first();
  if (!row) return null;
  return { id: Number(row.id), email: row.email, displayName: row.display_name, passwordHash: row.password_hash, passwordSalt: row.password_salt, passwordIterations: Number(row.password_iterations), token: row.token, expiresAt: row.expires_at };
}

export async function requireAuth(request, env, { mutate = false } = {}) {
  if (mutate) assertSameOrigin(request);
  const user = await getCurrentUser(request, env);
  if (!user) throw Object.assign(new Error('Please sign in to manage the catalog.'), { status: 401, code: 'unauthorized' });
  return user;
}

export function publicUser(user) {
  return { id: user.id, email: user.email, displayName: user.displayName };
}

export { SESSION_COOKIE, SESSION_TTL_MS, PBKDF2_ITERATIONS };
