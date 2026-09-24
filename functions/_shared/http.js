export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': status >= 400 ? 'no-store' : 'no-cache',
      ...extraHeaders,
    },
  });
}

export function error(message, status = 400, code = 'bad_request') {
  return json({ error: message, code }, status);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400, code: 'invalid_json' });
  }
}

export function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookie(token, request, maxAge = 60 * 60 * 24 * 7) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `ciyora_session=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

export function clearedSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `ciyora_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}

export function assertSameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    throw Object.assign(new Error('Cross-origin requests are not allowed.'), { status: 403, code: 'cross_origin' });
  }
}

export function handleError(err) {
  console.error(err);
  return error(err?.message || 'Unexpected server error.', err?.status || 500, err?.code || 'server_error');
}
