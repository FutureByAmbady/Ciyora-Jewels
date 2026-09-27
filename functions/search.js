export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.pathname = '/';
  return context.env.ASSETS.fetch(url.toString(), context.request);
}
