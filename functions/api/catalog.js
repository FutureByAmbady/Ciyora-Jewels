import { readCatalog } from '../_shared/catalog.js';
import { json, handleError } from '../_shared/http.js';

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    return json(await readCatalog(env.DB, { query: Object.fromEntries(url.searchParams.entries()) }));
  } catch (err) {
    return handleError(err);
  }
}
