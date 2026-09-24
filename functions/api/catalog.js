import { readCatalog } from '../_shared/catalog.js';
import { json, handleError } from '../_shared/http.js';

export async function onRequestGet({ env }) {
  try {
    return json(await readCatalog(env.DB));
  } catch (err) {
    return handleError(err);
  }
}
