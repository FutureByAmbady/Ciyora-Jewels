  let products = [];
  let categories = [];
  let settings = {};
  let currentUser = null;
  let deleteId = null;
  let editingId = null;
  let editingCategoryIndex = null;
  let currentPage = 'dashboard';
  let loading = false;

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[char]));
  const formValue = id => document.getElementById(id)?.value.trim() || '';

  function setLoading(value){
    loading = value;
    document.body.classList.toggle('is-loading', value);
  }

  function showLoginError(message){
    const target = document.getElementById('loginError');
    if(target){ target.textContent = message; target.hidden = !message; }
  }

  function showToast(msg, type='success'){
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const icons = {success:'check-circle',error:'alert-circle',info:'info'};
    const toast = document.createElement('div');
    toast.className = 'toast '+type;
    toast.innerHTML = `<div class="toast-icon"><i data-lucide="${icons[type] || 'info'}"></i></div><div class="toast-text">${escapeHtml(msg)}</div><button class="toast-close" onclick="removeToast(this.parentElement)" aria-label="Close"><i data-lucide="x"></i></button>`;
    container.appendChild(toast);
    refreshIcons();
    setTimeout(() => removeToast(toast), 3500);
  }
  function removeToast(el){
    if(!el || el.classList.contains('removing')) return;
    el.classList.add('removing');
    setTimeout(() => el.remove(), 300);
  }

  async function reloadCatalog(){
    const payload = await CiyoraCatalog.getAdminCatalog();
    products = payload.products || [];
    categories = payload.categories || [];
    settings = payload.settings || {};
    renderAll();
  }

  function openApp(){
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.add('active');
    const name = currentUser?.displayName || 'Ciyora Admin';
    document.querySelectorAll('.sidebar-user-name').forEach(el => el.textContent = name);
    document.querySelectorAll('.topbar-profile').forEach(el => el.textContent = name.slice(0,2).toUpperCase());
    loadSettings();
    refreshIcons();
  }

  async function startSession(user){
    currentUser = user;
    openApp();
    await reloadCatalog();
    loadSettings();
    goTo('dashboard');
  }

  async function handleLogin(e){
    e.preventDefault();
    if(loading) return;
    const form = e.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const email = form.querySelector('input[type="email"]')?.value.trim() || '';
    const password = form.querySelector('input[type="password"]')?.value || '';
    showLoginError('');
    setLoading(true);
    if(button) button.disabled = true;
    try {
      const result = await CiyoraCatalog.login({email,password});
      await startSession(result.user);
      form.reset();
      showToast('Welcome back, Admin','success');
    } catch(error) {
      showLoginError(error.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
      if(button) button.disabled = false;
    }
  }

  async function handleLogout(){
    try { await CiyoraCatalog.logout(); } catch(error) { console.warn('Logout request failed', error); }
    currentUser = null;
    products = [];
    categories = [];
    document.getElementById('app').classList.remove('active');
    document.getElementById('loginScreen').classList.remove('hidden');
    showLoginError('');
    showToast('Logged out successfully','info');
  }

  async function handleApiError(error){
    if(error?.status === 401){
      currentUser = null;
      document.getElementById('app').classList.remove('active');
      document.getElementById('loginScreen').classList.remove('hidden');
      showLoginError('Your session expired. Please sign in again.');
      return true;
    }
    showToast(error?.message || 'Something went wrong','error');
    return false;
  }

  function goTo(page){
    currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-'+page);
    if(target) target.classList.add('active');
    document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    const titles = {dashboard:'Dashboard',products:'Products',add:'Add Product',edit:'Edit Product',categories:'Categories',settings:'Settings'};
    document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function toggleSidebar(){
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
  }

  function renderAll(){ renderStats(); renderRecent(); renderProducts(); renderCategories(); renderCategoryOptions(); renderEditPreview(); refreshIcons(); }
  function renderStats(){
    const total = products.length;
    const published = products.filter(p => p.status === 'published').length;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-published').textContent = published;
    document.getElementById('stat-hidden').textContent = total - published;
    document.getElementById('stat-categories').textContent = categories.length;
  }
  function renderRecent(){
    const list = document.getElementById('recentList');
    if(!list) return;
    list.innerHTML = products.slice(0,5).map(p => `<div class="recent-item" onclick="openEdit(${Number(p.id)})"><div class="recent-img"><img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'"></div><div class="recent-info"><div class="recent-name">${escapeHtml(p.name)}</div><div class="recent-meta"><span>${escapeHtml(p.cat)}</span><span>·</span><span class="badge ${p.status==='published'?'badge-success':'badge-muted'}">${p.status==='published'?'Published':'Hidden'}</span></div></div><div class="recent-price">${escapeHtml(p.price)}</div></div>`).join('');
  }
  function renderProducts(){
    const q = (document.getElementById('productSearch')?.value || '').trim().toLowerCase();
    const status = document.getElementById('productStatusFilter')?.value || 'all';
    const sort = document.getElementById('productSort')?.value || 'recent';
    const filtered = products.filter(p => `${p.name || ''} ${p.cat || ''}`.toLowerCase().includes(q) && (status === 'all' || (p.status || 'hidden') === status)).sort((a,b) => {
      if(sort === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
      if(sort === 'status') return (a.status === 'published' ? 0 : 1) - (b.status === 'published' ? 0 : 1);
      if(sort === 'price') return String(b.price || '').localeCompare(String(a.price || ''), undefined, {numeric:true});
      return Number(b.id || 0) - Number(a.id || 0);
    });
    const tbody = document.getElementById('productsTable');
    const wrap = document.getElementById('productsTableWrap');
    const empty = document.getElementById('productsEmpty');
    if(!tbody || !wrap || !empty) return;
    if(products.length === 0){ wrap.style.display = 'none'; empty.style.display = 'block'; }
    else {
      wrap.style.display = 'block'; empty.style.display = 'none';
      tbody.innerHTML = filtered.length ? filtered.map(p => { const published = p.status === 'published'; return `<tr><td><div class="prod-cell"><div class="prod-img"><img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'"></div><div><div class="prod-name">${escapeHtml(p.name)}</div><div class="prod-cat">${escapeHtml(p.price)}</div></div></div></td><td><span style="font-size:13px">${escapeHtml(p.cat)}</span></td><td><span class="badge ${published?'badge-success':'badge-muted'}">${published?'Published':'Hidden'}</span></td><td><div class="actions-cell" style="justify-content:flex-end"><button class="action-btn edit" onclick="openEdit(${Number(p.id)})" title="Edit" aria-label="Edit"><i data-lucide="pencil"></i></button><button class="action-btn hide" onclick="toggleStatus(${Number(p.id)})" title="${published?'Hide':'Show'}" aria-label="Toggle visibility"><i data-lucide="${published?'eye-off':'eye'}"></i></button><button class="action-btn delete" onclick="openDelete(${Number(p.id)})" title="Delete" aria-label="Delete"><i data-lucide="trash-2"></i></button></div></td></tr>`; }).join('') : '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--muted)">No products match these filters</td></tr>';
    }
    document.getElementById('productsCount').textContent = `${filtered.length} of ${products.length} item${products.length!==1?'s':''}`;
  }
  function renderCategories(){
    const list = document.getElementById('catList');
    if(!list) return;
    const counts = products.reduce((result, product) => { result[product.cat] = (result[product.cat] || 0) + 1; return result; }, {});
    list.innerHTML = categories.map((c,i) => `<div class="cat-item"><div class="cat-icon"><i data-lucide="${escapeHtml(c.icon || 'folder')}"></i></div><div class="cat-name">${escapeHtml(c.name)}</div><div class="cat-count">${counts[c.name] || 0} product${(counts[c.name] || 0) === 1 ? '' : 's'}</div><button class="action-btn edit" onclick="openCategoryModal(${i})" title="Edit" aria-label="Edit category"><i data-lucide="pencil"></i></button><button class="action-btn delete" onclick="deleteCategory(${i})" title="Delete" aria-label="Delete category"><i data-lucide="trash-2"></i></button></div>`).join('');
    const countLabel = document.getElementById('categoriesCount');
    if(countLabel) countLabel.textContent = `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}`;
  }
  function renderCategoryOptions(){
    const selects = [document.querySelector('#page-add .form-select'), document.getElementById('edit-category')].filter(Boolean);
    selects.forEach(select => { const current = select.value; select.innerHTML = (select.id === 'edit-category' ? '' : '<option value="">Select category</option>') + categories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join(''); if(categories.some(c => c.name === current)) select.value = current; });
  }
  function renderEditPreview(product = products.find(item => item.id === editingId) || products[0]){
    const preview = document.getElementById('editPreview');
    if(!preview) return;
    const imgs = product?.imgs?.length ? product.imgs : (product?.img ? [product.img] : []);
    preview.innerHTML = imgs.map(src => `<div class="upload-thumb"><img src="${escapeHtml(src)}" alt=""><button type="button" class="upload-thumb-remove" onclick="this.parentElement.remove();showToast('Image removed','info')" aria-label="Remove image"><i data-lucide="x"></i></button></div>`).join('');
  }

  function openCategoryModal(index = null){
    editingCategoryIndex = Number.isInteger(index) ? index : null;
    const category = editingCategoryIndex === null ? null : categories[editingCategoryIndex];
    document.getElementById('categoryModalTitle').textContent = category ? 'Edit Category' : 'Add Category';
    document.getElementById('categoryNameInput').value = category?.name || '';
    document.getElementById('categoryIconInput').value = category?.icon || 'sparkles';
    document.getElementById('categoryModal').classList.add('open');
    setTimeout(() => document.getElementById('categoryNameInput').focus(), 0);
  }
  function closeCategoryModal(){ document.getElementById('categoryModal').classList.remove('open'); editingCategoryIndex = null; }
  async function saveCategory(e){
    e.preventDefault();
    const name = formValue('categoryNameInput');
    const icon = formValue('categoryIconInput').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'folder';
    if(!name) return showToast('Category name is required','error');
    const duplicate = categories.some((category,index) => category.name.toLowerCase() === name.toLowerCase() && index !== editingCategoryIndex);
    if(duplicate) return showToast('That category already exists','error');
    const isNew = editingCategoryIndex === null;
    try {
      if(isNew) await CiyoraCatalog.createCategory({name,icon});
      else await CiyoraCatalog.updateCategory({id:categories[editingCategoryIndex].id,name,icon});
      closeCategoryModal(); await reloadCatalog(); showToast(isNew ? 'Category added' : 'Category updated','success');
    } catch(error) { await handleApiError(error); }
  }
  async function deleteCategory(index){
    const category = categories[index];
    if(!category) return;
    const usage = products.filter(product => product.cat === category.name).length;
    if(usage) return showToast(`Move ${usage} product${usage === 1 ? '' : 's'} before deleting this category`,'info');
    if(!window.confirm(`Delete the “${category.name}” category?`)) return;
    try { await CiyoraCatalog.deleteCategory(category.id); await reloadCatalog(); showToast('Category deleted','success'); } catch(error) { await handleApiError(error); }
  }

  function openEdit(id){
    const product = products.find(item => Number(item.id) === Number(id));
    if(!product) return;
    editingId = Number(id);
    document.getElementById('edit-name').value = product.name || '';
    renderCategoryOptions();
    document.getElementById('edit-category').value = product.cat || '';
    document.getElementById('edit-desc').value = product.desc || '';
    document.getElementById('edit-price').value = product.price || '';
    document.getElementById('edit-wa').value = product.whatsapp || '';
    document.getElementById('edit-ig').value = product.instagram || '';
    document.querySelectorAll('input[name="edit-status"]').forEach(input => { const active = input.value === product.status; input.checked = active; input.closest('.status-opt')?.classList.toggle('active', active); });
    renderEditPreview(product);
    goTo('edit');
  }
  async function toggleStatus(id){
    const product = products.find(item => Number(item.id) === Number(id));
    if(!product) return;
    try { await CiyoraCatalog.updateProduct({...product,status:product.status === 'published' ? 'hidden' : 'published'}); await reloadCatalog(); showToast(product.status === 'published' ? 'Product hidden' : 'Product published', product.status === 'published' ? 'info' : 'success'); } catch(error) { await handleApiError(error); }
  }
  function openDelete(id){ deleteId = Number(id); document.getElementById('deleteModal').classList.add('open'); }
  function closeModal(){ document.getElementById('deleteModal').classList.remove('open'); deleteId = null; }
  async function confirmDelete(){
    if(deleteId === null) return;
    try { await CiyoraCatalog.deleteProduct(deleteId); closeModal(); await reloadCatalog(); showToast('Product deleted','error'); } catch(error) { await handleApiError(error); }
  }
  function selectStatus(el){ el.parentElement.querySelectorAll('.status-opt').forEach(option => option.classList.remove('active')); el.classList.add('active'); el.querySelector('input').checked = true; }
  function getPreviewImages(previewId){ return Array.from(document.querySelectorAll(`#${previewId} img`)).map(img => img.getAttribute('src')).filter(Boolean); }

  async function handleSaveProduct(e){
    e.preventDefault();
    const form = e.currentTarget;
    const inputs = form.querySelectorAll('.form-input');
    const product = {name:inputs[0]?.value.trim() || 'Untitled Product',cat:form.querySelector('.form-select')?.value || 'Uncategorized',desc:form.querySelector('.form-textarea')?.value.trim() || '',price:inputs[1]?.value.trim() || 'Price on request',whatsapp:inputs[2]?.value.trim() || '',instagram:form.querySelector('input[type="url"]')?.value.trim() || '',material:'Not specified',color:'Not specified',weight:'Not specified',sizes:['One Size'],badge:'',status:form.querySelector('input[name="status"]:checked')?.value || 'published',imgs:getPreviewImages('uploadPreview')};
    try { await CiyoraCatalog.createProduct(product); form.reset(); document.getElementById('uploadPreview').innerHTML = ''; await reloadCatalog(); showToast('Product published successfully','success'); setTimeout(() => goTo('products'), 600); } catch(error) { await handleApiError(error); }
  }
  async function handleUpdateProduct(e){
    e.preventDefault();
    const product = products.find(item => Number(item.id) === Number(editingId));
    if(!product) return;
    const updated = {...product,id:editingId,name:formValue('edit-name'),cat:formValue('edit-category'),desc:formValue('edit-desc'),price:formValue('edit-price') || 'Price on request',whatsapp:formValue('edit-wa'),instagram:formValue('edit-ig'),status:document.querySelector('input[name="edit-status"]:checked')?.value || product.status,imgs:getPreviewImages('editPreview')};
    try { await CiyoraCatalog.updateProduct(updated); await reloadCatalog(); showToast('Product updated successfully','success'); setTimeout(() => goTo('products'), 600); } catch(error) { await handleApiError(error); }
  }

  function loadSettings(){
    const form = document.querySelector('#page-settings form');
    const inputs = form?.querySelectorAll('.form-input');
    if(!inputs) return;
    inputs[0].value = settings.businessName || 'Ciyora Jewels';
    inputs[1].value = settings.email || '';
    inputs[2].value = settings.instagram || '';
    inputs[3].value = settings.whatsapp || '';
  }
  async function handleSaveSettings(e){
    e.preventDefault();
    const inputs = e.currentTarget.querySelectorAll('.form-input');
    const business = {businessName:inputs[0]?.value.trim() || 'Ciyora Jewels',email:inputs[1]?.value.trim() || '',instagram:inputs[2]?.value.trim() || '',whatsapp:inputs[3]?.value.trim() || ''};
    const currentPassword = inputs[4]?.value || '';
    const newPassword = inputs[5]?.value || '';
    const confirmPassword = inputs[6]?.value || '';
    try {
      const result = await CiyoraCatalog.saveSettings(business);
      settings = result.settings || business;
      if(currentPassword || newPassword || confirmPassword){
        if(newPassword.length < 12) throw new Error('New password must be at least 12 characters.');
        if(newPassword !== confirmPassword) throw new Error('New password and confirmation do not match.');
        await CiyoraCatalog.changePassword({currentPassword,newPassword});
        inputs[4].value = ''; inputs[5].value = ''; inputs[6].value = '';
      }
      showToast('Settings saved securely','success');
    } catch(error) { await handleApiError(error); }
  }
  function exportCatalog(){
    const blob = new Blob([JSON.stringify({version:2,exportedAt:new Date().toISOString(),products,categories,settings},null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `ciyora-catalog-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); showToast('Catalog backup downloaded','success');
  }
  function importCatalog(file){
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const payload = JSON.parse(event.target.result);
        if(!Array.isArray(payload.products) || !Array.isArray(payload.categories)) throw new Error('Invalid catalog format');
        const importedProducts = payload.products.filter(item => item && item.name && item.cat).map(item => ({...item,id:undefined,name:String(item.name).trim(),cat:String(item.cat).trim(),status:item.status === 'hidden' ? 'hidden' : 'published',imgs:Array.isArray(item.imgs) ? item.imgs.filter(Boolean) : (item.img ? [item.img] : []),img:item.img || ''}));
        const importedCategories = payload.categories.filter(item => item && item.name).map(item => ({name:String(item.name).trim(),icon:String(item.icon || 'folder').toLowerCase().replace(/[^a-z0-9-]/g,'') || 'folder'}));
        if(!importedProducts.length && !importedCategories.length) throw new Error('The backup contains no catalog data');
        await CiyoraCatalog.replaceCatalog({products:importedProducts,categories:importedCategories,settings:payload.settings || settings});
        await reloadCatalog(); showToast(`Imported ${products.length} products and ${categories.length} categories`,'success');
      } catch(error) { await handleApiError(error); }
      document.getElementById('catalogImportInput').value = '';
    };
    reader.readAsText(file);
  }
  async function resetCatalog(){
    if(!window.confirm('Reset the online catalog to the original Ciyora demo data?')) return;
    try { await CiyoraCatalog.replaceCatalog(CiyoraCatalog.getDemoCatalog()); await reloadCatalog(); showToast('Demo catalog restored','success'); } catch(error) { await handleApiError(error); }
  }

  function handleGlobalSearch(val){ if(!val.trim()) return; goTo('products'); setTimeout(() => { document.getElementById('productSearch').value = val; renderProducts(); }, 100); }
  function handleFiles(files){ addFiles(files,'uploadPreview'); }
  function handleEditFiles(files){ addFiles(files,'editPreview'); }
  function addFiles(files, previewId){
    const preview = document.getElementById(previewId);
    Array.from(files || []).forEach(file => { if(!file.type.startsWith('image/')) return; const reader = new FileReader(); reader.onload = e => { const div = document.createElement('div'); div.className = 'upload-thumb'; div.innerHTML = `<img src="${escapeHtml(e.target.result)}" alt=""><button type="button" class="upload-thumb-remove" onclick="this.parentElement.remove()" aria-label="Remove"><i data-lucide="x"></i></button>`; preview.appendChild(div); refreshIcons(); }; reader.readAsDataURL(file); });
  }
  function refreshIcons(){ if(window.lucide) lucide.createIcons(); }

  const uploadArea = document.getElementById('uploadArea');
  if(uploadArea){
    ['dragenter','dragover'].forEach(eventName => uploadArea.addEventListener(eventName, e => { e.preventDefault(); uploadArea.classList.add('drag'); }));
    ['dragleave','drop'].forEach(eventName => uploadArea.addEventListener(eventName, e => { e.preventDefault(); uploadArea.classList.remove('drag'); }));
    uploadArea.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
  }
  document.addEventListener('keydown', e => { if(e.key === 'Escape'){ closeModal(); closeCategoryModal(); } });
  document.getElementById('deleteModal')?.addEventListener('click', e => { if(e.target.id === 'deleteModal') closeModal(); });
  document.getElementById('categoryModal')?.addEventListener('click', e => { if(e.target.id === 'categoryModal') closeCategoryModal(); });

  window.addEventListener('DOMContentLoaded', async () => {
    refreshIcons();
    try { const result = await CiyoraCatalog.me(); await startSession(result.user); }
    catch(error){
      const localStaticPreview = error.status === 404 && ['localhost','127.0.0.1'].includes(window.location.hostname);
      if(error.status && error.status !== 401 && !localStaticPreview) showLoginError(error.message || 'The admin service is unavailable.');
    }
  });
