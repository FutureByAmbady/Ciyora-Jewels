(() => {
  const API_BASE = '/api';
  const seedProducts = [
    {id:1,name:'Celestial Diamond Ring',cat:'Rings',desc:'A brilliant solitaire set in 18k white gold with a halo of micro-pavé diamonds.',price:'₹1,85,000',material:'White Gold, Diamond',color:'Silver',weight:'4.2g',sizes:['5','6','7','8','9'],badge:'New',status:'published',img:'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/14c8cb2fa-6e95-46d9-9c9f-4c807e2777a2.png',imgs:['https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/14c8cb2fa-6e95-46d9-9c9f-4c807e2777a2.png']},
    {id:2,name:'Eternal Gold Pendant',cat:'Necklaces',desc:'Handcrafted 22k gold pendant with intricate filigree work and diamond accents.',price:'₹95,000',material:'22k Gold, Diamond',color:'Gold',weight:'12.5g',sizes:['16"','18"','20"'],badge:'Featured',status:'published',img:'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1f031e101-027d-4883-9144-c22aff3ed931.png',imgs:['https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1f031e101-027d-4883-9144-c22aff3ed931.png']},
    {id:3,name:'Diamond Tennis Bracelet',cat:'Bracelets',desc:'Classic tennis bracelet with 24 round brilliant diamonds set in 18k gold.',price:'₹2,45,000',material:'18k Gold, Diamond',color:'Gold',weight:'8.3g',sizes:['6.5"','7"','7.5"'],badge:'New',status:'published',img:'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/110bd196a-fd16-4270-990e-51fbdb941c75.png',imgs:['https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/110bd196a-fd16-4270-990e-51fbdb941c75.png']},
    {id:4,name:'Pearl Drop Earrings',cat:'Earrings',desc:'Elegant South Sea pearl drops surrounded by a halo of sparkling diamonds.',price:'₹1,25,000',material:'Silver, Pearl, Diamond',color:'White',weight:'6.1g',sizes:['One Size'],badge:'',status:'published',img:'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1bf43121f-d744-455a-a0cb-e08408204bee.png',imgs:['https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1bf43121f-d744-455a-a0cb-e08408204bee.png']},
    {id:5,name:'Royal Bridal Set',cat:'Bridal',desc:'Traditional temple jewelry bridal set with Lakshmi pendant and matching jhumkas.',price:'₹4,85,000',material:'22k Gold, Ruby',color:'Gold',weight:'85g',sizes:['Adjustable'],badge:'Bridal',status:'published',img:'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1023075f1-b736-442a-88f6-092ab8700e91.png',imgs:['https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1023075f1-b736-442a-88f6-092ab8700e91.png']},
    {id:6,name:'Temple Goddess Necklace',cat:'Temple Jewelry',desc:'Antique-finish temple necklace featuring Goddess Lakshmi with ruby accents.',price:'₹3,25,000',material:'22k Gold, Ruby, Emerald',color:'Gold',weight:'62g',sizes:['Adjustable'],badge:'Heritage',status:'hidden',img:'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1d6a045d1-efd8-4aa1-96f3-b5220e564fc6.png',imgs:['https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/1d6a045d1-efd8-4aa1-96f3-b5220e564fc6.png']},
    {id:7,name:'Pearl Halo Necklace',cat:'Necklaces',desc:'South Sea pearl centerpiece surrounded by brilliant diamonds in a floral halo.',price:'₹1,65,000',material:'Silver, Pearl, Diamond',color:'White',weight:'14.8g',sizes:['16"','18"','20"'],badge:'New',status:'published',img:'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/19a763985-0e41-402c-b068-e7141841f002.png',imgs:['https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/19a763985-0e41-402c-b068-e7141841f002.png']},
    {id:8,name:'Rose Gold Stack Rings',cat:'Rings',desc:'Set of three delicate rose gold rings with pavé diamonds, perfect for stacking.',price:'₹78,000',material:'Rose Gold, Diamond',color:'Rose Gold',weight:'5.6g',sizes:['5','6','7','8'],badge:'Trending',status:'hidden',img:'https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/11f368e12-1d5f-40ba-b208-953358693a61.png',imgs:['https://image.qwenlm.ai/public_source/588dfb9c-bb33-4903-9c84-1c80faecb632/11f368e12-1d5f-40ba-b208-953358693a61.png']}
  ];
  const seedCategories = [{name:'Rings',count:12,icon:'circle'},{name:'Necklaces',count:18,icon:'link'},{name:'Bracelets',count:9,icon:'watch'},{name:'Earrings',count:15,icon:'sparkles'},{name:'Bridal',count:8,icon:'heart'},{name:'Temple Jewelry',count:6,icon:'landmark'}];
  const copy = value => JSON.parse(JSON.stringify(value));
  const repairText = value => String(value ?? '').replaceAll('â‚¹','₹').replaceAll('Â·','·').replaceAll('Ã©','é').replaceAll('Ã—','×');
  const normalizeProduct = product => ({...product,name:repairText(product.name),desc:repairText(product.desc),price:repairText(product.price),cat:repairText(product.cat) === 'Temple' ? 'Temple Jewelry' : repairText(product.cat),status:product.status === 'hidden' ? 'hidden' : 'published',imgs:Array.isArray(product.imgs) && product.imgs.length ? product.imgs : (product.img ? [product.img] : []),img:product.img || product.imgs?.[0] || ''});
  const normalizeCatalog = payload => ({products:(payload.products || []).map(normalizeProduct),categories:(payload.categories || []).map(category => ({...category,name:repairText(category.name),count:Number(category.count) || 0})),settings:payload.settings || {businessName:'Ciyora Jewels',email:'',instagram:'',whatsapp:''}});
  class ApiError extends Error { constructor(message,status,code){super(message);this.status=status;this.code=code;} }
  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {credentials:'include', headers:{'Content-Type':'application/json', ...(options.headers || {})}, ...options});
    let body = null;
    try { body = await response.json(); } catch {}
    if(!response.ok) throw new ApiError(body?.error || `Request failed (${response.status})`, response.status, body?.code || 'request_failed');
    return body;
  }
  const demoCatalog = () => ({products:copy(seedProducts),categories:copy(seedCategories),settings:{businessName:'Ciyora Jewels',email:'hello@ciyorajewels.com',instagram:'https://instagram.com/ciyorajewels',whatsapp:'+91 98765 43210'}});
  async function getPublicCatalog(){
    try { return normalizeCatalog(await request('/catalog')); }
    catch(error){
      const localStaticPreview = error.status === 404 && ['localhost','127.0.0.1'].includes(window.location.hostname);
      if(!error.status || localStaticPreview){ console.warn('Ciyora API unavailable; showing demo catalog.', error); return normalizeCatalog(demoCatalog()); }
      throw error;
    }
  }
  async function getAdminCatalog(){ return normalizeCatalog(await request('/admin/catalog')); }
  const createProduct = product => request('/admin/products',{method:'POST',body:JSON.stringify(product)});
  const updateProduct = product => request('/admin/products',{method:'PUT',body:JSON.stringify(product)});
  const deleteProduct = id => request(`/admin/products?id=${encodeURIComponent(id)}`,{method:'DELETE'});
  const createCategory = category => request('/admin/categories',{method:'POST',body:JSON.stringify(category)});
  const updateCategory = category => request('/admin/categories',{method:'PUT',body:JSON.stringify(category)});
  const deleteCategory = id => request(`/admin/categories?id=${encodeURIComponent(id)}`,{method:'DELETE'});
  const replaceCatalog = payload => request('/admin/catalog',{method:'PUT',body:JSON.stringify(payload)});
  const getSettings = async () => (await request('/admin/settings')).settings;
  const saveSettings = settings => request('/admin/settings',{method:'PUT',body:JSON.stringify(settings)});
  const login = credentials => request('/auth/login',{method:'POST',body:JSON.stringify(credentials)});
  const me = () => request('/auth/me');
  const logout = () => request('/auth/logout',{method:'POST',body:'{}'});
  const changePassword = payload => request('/auth/password',{method:'POST',body:JSON.stringify(payload)});
  window.CiyoraCatalog = {getPublicCatalog,getAdminCatalog,createProduct,updateProduct,deleteProduct,createCategory,updateCategory,deleteCategory,replaceCatalog,getSettings,saveSettings,login,me,logout,changePassword,getDemoCatalog:demoCatalog,ApiError};
})();
