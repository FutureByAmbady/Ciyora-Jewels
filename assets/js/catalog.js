(() => {
  const API_BASE = '/api';
  const repairText = value => String(value ?? '').replaceAll('â‚¹','₹').replaceAll('Â·','·').replaceAll('Ã©','é').replaceAll('Ã—','×');
  const normalizeProduct = product => ({...product,name:repairText(product.name),desc:repairText(product.desc),price:repairText(product.price),cat:repairText(product.cat) === 'Temple' ? 'Temple Jewelry' : repairText(product.cat),status:product.status === 'hidden' ? 'hidden' : 'published',imgs:Array.isArray(product.imgs) && product.imgs.length ? product.imgs : (product.img ? [product.img] : []),img:product.img || product.imgs?.[0] || '',stone:repairText(product.stone),dimensions:repairText(product.dimensions)});
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
  window.CiyoraCatalog = {getPublicCatalog,getAdminCatalog,createProduct,updateProduct,deleteProduct,createCategory,updateCategory,deleteCategory,replaceCatalog,saveSettings,login,me,logout,changePassword,ApiError};
})();
