(() => {
  const API_BASE = '/api';
  const repairText = value => String(value ?? '').replaceAll('\u00e2\u201a\u00b9','\u20b9').replaceAll('\u00c2\u00b7','\u00b7').replaceAll('\u00c3\u201a\u00c2\u00b7','\u00b7').replaceAll('\u00c3\u00a9','\u00e9').replaceAll('\u00c3\u2014','\u00d7').replaceAll('\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u009d','\u2014').replaceAll('\u00c3\u00a2\u00e2\u201e\u00a2\u00c2\u00a5','\u2665');
  const formatInr = value => { const raw=repairText(value).trim(); const amount=Number(String(raw).replace(/[^0-9.]/g,'')); return Number.isFinite(amount)&&amount>0 ? new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(amount) : raw || 'Price on request'; };
  const normalizeProduct = product => ({...product,name:repairText(product.name),desc:repairText(product.desc),price:formatInr(product.priceAmount ?? product.price),compareAtPrice:formatInr(product.compareAtPrice),cat:repairText(product.cat) === 'Temple' ? 'Temple Jewelry' : repairText(product.cat),status:product.status === 'hidden' ? 'hidden' : 'published',imgs:Array.isArray(product.imgs) && product.imgs.length ? product.imgs : (product.img ? [product.img] : []),img:product.img || product.imgs?.[0] || '',stone:repairText(product.stone),dimensions:repairText(product.dimensions)});
  const normalizeCatalog = payload => ({products:(payload.products || []).map(normalizeProduct),categories:(payload.categories || []).map(category => ({...category,name:repairText(category.name),count:Number(category.count) || 0})),settings:payload.settings || {businessName:'Ciyora Jewels',email:'',instagram:'',whatsapp:''}});
  class ApiError extends Error { constructor(message,status,code){super(message);this.status=status;this.code=code;} }
  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {credentials:'include', headers:{'Content-Type':'application/json', ...(options.headers || {})}, ...options});
    let body = null; try { body = await response.json(); } catch {}
    if(!response.ok) throw new ApiError(body?.error || `Request failed (${response.status})`, response.status, body?.code || 'request_failed');
    return body;
  }
  const emptyCatalog = () => ({products:[],categories:[],settings:{businessName:'Ciyora Jewels',email:'',instagram:'',whatsapp:''}});
  async function getPublicCatalog(){
    try { return normalizeCatalog(await request('/catalog')); }
    catch(error){ const localStaticPreview=error.status===404&&['localhost','127.0.0.1'].includes(window.location.hostname); if(!error.status||localStaticPreview){console.warn('Ciyora API unavailable; showing an empty catalogue.',error);return normalizeCatalog(emptyCatalog());} throw error; }
  }
  async function getAdminCatalog(){ return normalizeCatalog(await request('/admin/catalog')); }
  const createProduct = product => request('/admin/products',{method:'POST',body:JSON.stringify(product)});
  const updateProduct = product => request('/admin/products',{method:'PUT',body:JSON.stringify(product)});
  const deleteProduct = id => request(`/admin/products?id=${encodeURIComponent(id)}`,{method:'DELETE'});
  const createCategory = category => request('/admin/categories',{method:'POST',body:JSON.stringify(category)});
  const updateCategory = category => request('/admin/categories',{method:'PUT',body:JSON.stringify(category)});
  const deleteCategory = id => request(`/admin/categories?id=${encodeURIComponent(id)}`,{method:'DELETE'});
  const replaceCatalog = payload => request('/admin/catalog',{method:'PUT',body:JSON.stringify(payload)});
  const saveSettings = settings => request('/admin/settings',{method:'PUT',body:JSON.stringify(settings)});
  const login = credentials => request('/auth/login',{method:'POST',body:JSON.stringify(credentials)});
  const me = () => request('/auth/me');
  const logout = () => request('/auth/logout',{method:'POST',body:'{}'});
  const changePassword = payload => request('/auth/password',{method:'POST',body:JSON.stringify(payload)});
  const getReviews = productId => request(`/reviews?product_id=${encodeURIComponent(productId)}`);
  const submitReview = payload => request('/reviews',{method:'POST',body:JSON.stringify(payload)});
  const trackEvent = payload => fetch(`${API_BASE}/events`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
  const getAdminReviews = status => request(`/admin/reviews${status?`?status=${encodeURIComponent(status)}`:''}`);
  const moderateReview = payload => request('/admin/reviews',{method:'PUT',body:JSON.stringify(payload)});
  const deleteReview = id => request(`/admin/reviews?id=${encodeURIComponent(id)}`,{method:'DELETE'});
  const getAnalytics = () => request('/admin/analytics');
  const getActivity = () => request('/admin/activity');
  window.CiyoraCatalog = {getPublicCatalog,getAdminCatalog,createProduct,updateProduct,deleteProduct,createCategory,updateCategory,deleteCategory,replaceCatalog,saveSettings,login,me,logout,changePassword,getReviews,submitReview,trackEvent,getAdminReviews,moderateReview,deleteReview,getAnalytics,getActivity,ApiError};
})();
