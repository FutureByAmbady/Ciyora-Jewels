let products = [];
let categories = [];
let settings = {};
let currentUser = null;
let deleteId = null;
let editingId = null;
let editingCategoryIndex = null;
let currentPage = 'dashboard';
let loading = false;
let skuTimer = null;
let dragPreviewId = null;

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[char]));
const formValue = id => document.getElementById(id)?.value.trim() || '';
const byId = id => document.getElementById(id);

function setLoading(value){ loading = value; document.body.classList.toggle('is-loading', value); }
function showLoginError(message){ const target = byId('loginError'); if(target){ target.textContent = message; target.hidden = !message; } }
function showToast(msg, type='success'){
  const container = byId('toastContainer'); if(!container) return;
  const icons = {success:'check-circle',error:'alert-circle',info:'info'};
  const toast = document.createElement('div'); toast.className = 'toast '+type;
  toast.innerHTML = `<div class="toast-icon"><i data-lucide="${icons[type] || 'info'}"></i></div><div class="toast-text">${escapeHtml(msg)}</div><button class="toast-close" onclick="removeToast(this.parentElement)" aria-label="Close"><i data-lucide="x"></i></button>`;
  container.appendChild(toast); refreshIcons(); setTimeout(() => removeToast(toast), 3500);
}
function removeToast(el){ if(!el || el.classList.contains('removing')) return; el.classList.add('removing'); setTimeout(() => el.remove(), 300); }
function refreshIcons(){ if(window.lucide) lucide.createIcons(); }

async function reloadCatalog(){
  const payload = await CiyoraCatalog.getAdminCatalog();
  products = payload.products || []; categories = payload.categories || []; settings = payload.settings || {};
  renderAll();
}
function openApp(){
  byId('loginScreen').classList.add('hidden'); byId('app').classList.add('active');
  const name = currentUser?.displayName || 'Ciyora Admin';
  document.querySelectorAll('.sidebar-user-name').forEach(el => el.textContent = name);
  document.querySelectorAll('.topbar-profile').forEach(el => el.textContent = name.slice(0,2).toUpperCase());
  loadSettings(); refreshIcons();
}
async function startSession(user){ currentUser = user; openApp(); await reloadCatalog(); loadSettings(); goTo('dashboard'); }
async function handleLogin(e){
  e.preventDefault(); if(loading) return; const form=e.currentTarget; const button=form.querySelector('button[type="submit"]');
  const email=form.querySelector('input[type="email"]')?.value.trim() || ''; const password=form.querySelector('input[type="password"]')?.value || '';
  showLoginError(''); setLoading(true); if(button) button.disabled=true;
  try { const result=await CiyoraCatalog.login({email,password}); await startSession(result.user); form.reset(); showToast('Welcome back, Admin','success'); }
  catch(error){ showLoginError(error.message || 'Unable to sign in.'); }
  finally { setLoading(false); if(button) button.disabled=false; }
}
async function handleLogout(){
  try { await CiyoraCatalog.logout(); } catch(error) { console.warn('Logout request failed', error); }
  currentUser=null; products=[]; categories=[]; byId('app').classList.remove('active'); byId('loginScreen').classList.remove('hidden'); showLoginError(''); showToast('Logged out successfully','info');
}
async function handleApiError(error){
  if(error?.status===401){ currentUser=null; byId('app').classList.remove('active'); byId('loginScreen').classList.remove('hidden'); showLoginError('Your session expired. Please sign in again.'); return true; }
  if(error?.code==='duplicate_sku' || error?.status===409){ showToast('That SKU is already used by another product.','error'); return false; }
  showToast(error?.message || 'Something went wrong','error'); return false;
}
function goTo(page){
  currentPage=page; document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); byId('page-'+page)?.classList.add('active');
  document.querySelectorAll('.nav-item[data-page]').forEach(n=>n.classList.toggle('active',n.dataset.page===page));
  const titles={dashboard:'Dashboard',products:'Products',add:'Add Product',edit:'Edit Product',categories:'Categories',settings:'Settings'}; byId('pageTitle').textContent=titles[page]||'Dashboard';
  byId('sidebar').classList.remove('open'); byId('sidebarOverlay').classList.remove('open'); window.scrollTo({top:0,behavior:'smooth'});
  if(page==='add') prepareAddForm();
}
function toggleSidebar(){ byId('sidebar').classList.toggle('open'); byId('sidebarOverlay').classList.toggle('open'); }
function renderAll(){ renderStats(); renderRecent(); renderProducts(); renderCategories(); renderCategoryOptions(); refreshIcons(); }
function renderStats(){
  const total=products.length, published=products.filter(p=>p.status==='published' && p.active!==false).length;
  byId('stat-total').textContent=total; byId('stat-published').textContent=published; byId('stat-hidden').textContent=total-published; byId('stat-categories').textContent=categories.filter(c=>c.active!==false).length;
}
function renderRecent(){
  const list=byId('recentList'); if(!list) return;
  list.innerHTML=products.slice(0,5).map(p=>`<div class="recent-item" onclick="openEdit(${Number(p.id)})"><div class="recent-img"><img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'"></div><div class="recent-info"><div class="recent-name">${escapeHtml(p.name)}</div><div class="recent-meta"><span>${escapeHtml(p.cat)}</span><span>·</span><span class="badge ${p.status==='published'?'badge-success':'badge-muted'}">${p.status==='published'?'Published':'Hidden'}</span></div></div><div class="recent-price">${escapeHtml(p.price)}</div></div>`).join('');
}
function productIssues(product){
  return [['Missing SKU',!String(product.sku||'').trim()],['Missing images',!(product.imgs?.length||product.img)],['Missing description',!String(product.desc||product.shortDescription||'').trim()]].filter(([,missing])=>missing).map(([label])=>label);
}
function completenessBadge(product){
  const issues=productIssues(product); return issues.length ? `<span class="quality-badge incomplete" title="${escapeHtml(issues.join(', '))}">Incomplete · ${escapeHtml(issues.join(' · '))}</span>` : '<span class="quality-badge complete">Complete</span>';
}
function renderProducts(){
  const q=(byId('productSearch')?.value||'').trim().toLowerCase(), status=byId('productStatusFilter')?.value||'all', sort=byId('productSort')?.value||'recent';
  const filtered=products.filter(p=>`${p.name||''} ${p.cat||''} ${p.sku||''}`.toLowerCase().includes(q)&&(status==='all'||(p.status||'hidden')===status)).sort((a,b)=>{if(sort==='name')return String(a.name||'').localeCompare(String(b.name||''));if(sort==='status')return (a.status==='published'?0:1)-(b.status==='published'?0:1);if(sort==='price')return String(b.price||'').localeCompare(String(a.price||''),undefined,{numeric:true});return Number(b.id||0)-Number(a.id||0);});
  const tbody=byId('productsTable'), wrap=byId('productsTableWrap'), empty=byId('productsEmpty'); if(!tbody||!wrap||!empty) return;
  if(products.length===0){wrap.style.display='none';empty.style.display='block';} else {wrap.style.display='block';empty.style.display='none';tbody.innerHTML=filtered.length?filtered.map(p=>{const pub=p.status==='published';return `<tr><td><div class="prod-cell"><div class="prod-img"><img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'"></div><div><div class="prod-name">${escapeHtml(p.name)}</div><div class="prod-cat">${escapeHtml(p.price)}</div><div style="margin-top:5px">${completenessBadge(p)}</div></div></div></td><td><span style="font-size:13px">${escapeHtml(p.cat)}</span></td><td><span class="badge ${pub?'badge-success':'badge-muted'}">${pub?'Published':'Hidden'}</span></td><td><div class="actions-cell" style="justify-content:flex-end"><button class="action-btn edit" onclick="openEdit(${Number(p.id)})" title="Edit" aria-label="Edit"><i data-lucide="pencil"></i></button><button class="action-btn hide" onclick="toggleStatus(${Number(p.id)})" title="${pub?'Hide':'Show'}" aria-label="Toggle visibility"><i data-lucide="${pub?'eye-off':'eye'}"></i></button><button class="action-btn delete" onclick="openDelete(${Number(p.id)})" title="Delete" aria-label="Delete"><i data-lucide="trash-2"></i></button></div></td></tr>`;}).join(''):'<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--muted)">No products match these filters</td></tr>';}
  byId('productsCount').textContent=`${filtered.length} of ${products.length} item${products.length!==1?'s':''}`; refreshIcons();
}
function renderCategories(){
  const list=byId('catList'); if(!list) return;
  const counts=products.filter(p=>p.status==='published'&&p.active!==false).reduce((r,p)=>(r[p.cat]=(r[p.cat]||0)+1,r),{});
  list.innerHTML=categories.map((c,i)=>`<div class="cat-item ${c.active===false?'is-archived':''}"><div class="cat-icon cat-image">${c.image?`<img src="${escapeHtml(c.image)}" alt="">`:'<i data-lucide="folder"></i>'}</div><div class="cat-name"><strong>${escapeHtml(c.name)}</strong><small>${escapeHtml(c.description||'No description')}</small></div><div class="cat-count">${counts[c.name]||0} product${(counts[c.name]||0)===1?'':'s'}<small>Order ${Number(c.displayOrder||0)}</small></div><span class="category-state ${c.active===false?'archived':'active'}">${c.active===false?'Archived':'Active'}</span><button class="action-btn edit" onclick="openCategoryModal(${i})" title="Edit" aria-label="Edit category"><i data-lucide="pencil"></i></button><button class="action-btn hide" onclick="archiveCategory(${i})" title="${c.active===false?'Restore':'Archive'}" aria-label="${c.active===false?'Restore':'Archive'} category"><i data-lucide="${c.active===false?'archive-restore':'archive'}"></i></button></div>`).join('');
  const countLabel=byId('categoriesCount'); if(countLabel) countLabel.textContent=`${categories.length} categor${categories.length===1?'y':'ies'}`; refreshIcons();
}
function renderCategoryOptions(){
  [byId('add-category'),byId('edit-category')].filter(Boolean).forEach(select=>{const current=select.value;select.innerHTML=(select.id==='add-category'?'<option value="">Select category</option>':'')+categories.filter(c=>c.active!==false||c.name===current).map(c=>`<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');if(categories.some(c=>c.name===current))select.value=current;});
}
function completenessSummary(mode){
  const prefix=mode==='edit'?'edit':'add', checks=[['SKU',formValue(`${prefix}-sku`)],['description',formValue(`${prefix}-desc`)],['image',getPreviewImages(`${prefix==='edit'?'edit':'upload'}Preview`).length]];
  const missing=checks.filter(([,value])=>!value).map(([label])=>label); const box=byId(`${prefix}-warnings`); if(!box) return;
  box.innerHTML=missing.length?`<strong>Before saving:</strong> ${missing.map(escapeHtml).join(', ')} ${missing.length===1?'is':'are'} missing. Optional Stone and Dimensions fields may remain blank.`:'<strong>Ready to save.</strong> Required product details are present. Optional fields may remain blank.'; box.className='form-warning '+(missing.length?'has-warning':'is-ready');
}
function renderEditPreview(product=products.find(item=>Number(item.id)===Number(editingId))||products[0]){
  const preview=byId('editPreview'); if(!preview) return; const imgs=product?.imgs?.length?product.imgs:(product?.img?[product.img]:[]); preview.innerHTML=''; imgs.forEach((src,index)=>insertImageThumb(preview,src,index===0)); completenessSummary('edit');
}
function insertImageThumb(container,src,primary=false){
  const div=document.createElement('div'); div.className='upload-thumb image-thumb'; div.draggable=true; div.dataset.src=src; div.dataset.primary=primary?'true':'false';
  div.innerHTML=`<img src="${escapeHtml(src)}" alt=""><span class="image-primary-label">${primary?'Primary':''}</span><div class="image-thumb-actions"><button type="button" class="image-action" onclick="setPrimaryImage(this.parentElement.parentElement)" title="Make primary"><i data-lucide="star"></i></button><button type="button" class="image-action" onclick="replaceImage(this.parentElement.parentElement)" title="Replace image"><i data-lucide="refresh-cw"></i></button><button type="button" class="image-action danger" onclick="this.parentElement.parentElement.remove();ensurePrimaryImage();updateFormWarnings()" title="Delete image"><i data-lucide="trash-2"></i></button></div>`;
  div.addEventListener('dragstart',()=>{dragPreviewId=container.id;div.classList.add('dragging');}); div.addEventListener('dragend',()=>div.classList.remove('dragging')); div.addEventListener('dragover',e=>e.preventDefault()); div.addEventListener('drop',e=>{e.preventDefault();const moving=document.querySelector('.image-thumb.dragging');if(moving&&moving!==div&&moving.parentElement===container){const rect=div.getBoundingClientRect();container.insertBefore(moving,e.clientY<rect.top+rect.height/2?div:div.nextSibling);}}); container.appendChild(div); refreshIcons();
}
function setPrimaryImage(div){ const container=div.parentElement; container.querySelectorAll('.image-thumb').forEach((item,index)=>{item.dataset.primary=item===div?'true':'false';item.querySelector('.image-primary-label').textContent=item===div?'Primary':'';}); container.prepend(div); updateFormWarnings(); }
function ensurePrimaryImage(){const c=byId('editPreview')||byId('uploadPreview');if(!c)return;const items=c.querySelectorAll('.image-thumb');if(items.length&&!Array.from(items).some(x=>x.dataset.primary==='true'))setPrimaryImage(items[0]);}
function getPreviewImages(previewId){const c=byId(previewId);return c?[...c.querySelectorAll('.image-thumb')].map(x=>x.dataset.src).filter(Boolean):[];}
function getPrimaryImage(previewId){const c=byId(previewId);return c?.querySelector('.image-thumb[data-primary="true"]')?.dataset.src||getPreviewImages(previewId)[0]||'';}
function addFiles(files,previewId){const preview=byId(previewId);if(!preview)return;Array.from(files||[]).forEach(file=>{if(!file.type.startsWith('image/')){showToast(`${file.name} is not an image.`,'error');return;}if(file.size>5*1024*1024){showToast(`${file.name} is larger than 5MB.`,'error');return;}const status=document.createElement('div');status.className='upload-progress';status.innerHTML=`<span>${escapeHtml(file.name)}</span><progress max="100" value="0"></progress>`;preview.parentElement.querySelector('.upload-status')?.appendChild(status);const reader=new FileReader();reader.onprogress=e=>{if(e.lengthComputable)status.querySelector('progress').value=Math.round(e.loaded/e.total*100);};reader.onerror=()=>{status.remove();showToast(`Could not read ${file.name}.`,'error');};reader.onload=e=>{status.remove();insertImageThumb(preview,e.target.result,preview.querySelectorAll('.image-thumb').length===0);updateFormWarnings();};reader.readAsDataURL(file);});}
function handleFiles(files){addFiles(files,'uploadPreview');}
function handleEditFiles(files){addFiles(files,'editPreview');}
function replaceImage(div){const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=()=>{const file=input.files?.[0];if(!file)return;if(!file.type.startsWith('image/')||file.size>5*1024*1024)return showToast('Choose an image up to 5MB.','error');const reader=new FileReader();reader.onload=e=>{div.dataset.src=e.target.result;div.querySelector('img').src=e.target.result;};reader.readAsDataURL(file);};input.click();}
function updateFormWarnings(){ completenessSummary(currentPage==='edit'?'edit':'add'); }
function prepareAddForm(){ const form=byId('addForm');if(form){form.reset();byId('uploadPreview').innerHTML='';byId('add-warnings').className='form-warning';byId('add-warnings').textContent='Complete the important fields before saving. Optional fields may remain blank.';} renderCategoryOptions(); clearSkuState('add'); }
function clearSkuState(mode){const input=byId(`${mode}-sku`),hint=byId(`${mode}-sku-hint`);if(input)input.classList.remove('invalid');if(hint){hint.textContent='';hint.className='field-help';}}
function checkSku(mode){
  const value=formValue(`${mode}-sku`).toLowerCase(); const hint=byId(`${mode}-sku-hint`), input=byId(`${mode}-sku`); if(!value){clearSkuState(mode);return true;}
  const duplicate=products.find(p=>String(p.sku||'').trim().toLowerCase()===value&&Number(p.id)!==Number(editingId)); if(duplicate){input?.classList.add('invalid');if(hint){hint.textContent=`This SKU is already used by ${duplicate.name}.`;hint.className='field-help error';}return false;}
  input?.classList.remove('invalid');if(hint){hint.textContent='SKU is available.';hint.className='field-help success';}return true;
}
function scheduleSkuCheck(mode){clearTimeout(skuTimer);skuTimer=setTimeout(()=>{checkSku(mode);updateFormWarnings();},180);}
function collectProduct(mode){
  const prefix=mode==='edit'?'edit':'add', form=byId(`${prefix}Form`), previewId=mode==='edit'?'editPreview':'uploadPreview';
  return {id:mode==='edit'?editingId:undefined,name:formValue(`${prefix}-name`),slug:formValue(`${prefix}-slug`),sku:formValue(`${prefix}-sku`),cat:formValue(`${prefix}-category`),desc:formValue(`${prefix}-desc`),price:formValue(`${prefix}-price`)||'Price on request',stockQuantity:Number(formValue(`${prefix}-stock`)||0),material:formValue(`${prefix}-material`),stone:formValue(`${prefix}-stone`),dimensions:formValue(`${prefix}-dimensions`),weight:formValue(`${prefix}-weight`),color:formValue(`${prefix}-color`),featured:byId(`${prefix}-featured`)?.checked||false,newArrival:byId(`${prefix}-new-arrival`)?.checked||false,status:form?.querySelector(`input[name="${prefix}-status"]:checked`)?.value||'published',imgs:getPreviewImages(previewId),img:getPrimaryImage(previewId),badge:byId(`${prefix}-new-arrival`)?.checked?'New':''};
}
function validateProduct(product,mode){
  if(!product.name||!product.cat)return 'Product name and category are required.';
  if(!checkSku(mode))return 'Choose a unique SKU before saving.';
  if(!product.desc)showToast('Description is missing. You can still save, but the product will be marked incomplete.','info');
  return '';
}
async function handleSaveProduct(e){e.preventDefault();const product=collectProduct('add'),error=validateProduct(product,'add');if(error)return showToast(error,'error');try{await CiyoraCatalog.createProduct(product);e.currentTarget.reset();byId('uploadPreview').innerHTML='';await reloadCatalog();showToast('Product saved successfully','success');setTimeout(()=>goTo('products'),600);}catch(err){await handleApiError(err);}}
async function handleUpdateProduct(e){e.preventDefault();const existing=products.find(item=>Number(item.id)===Number(editingId));if(!existing)return;const updated={...existing,...collectProduct('edit'),id:editingId};const error=validateProduct(updated,'edit');if(error)return showToast(error,'error');try{await CiyoraCatalog.updateProduct(updated);await reloadCatalog();showToast('Product updated successfully','success');setTimeout(()=>goTo('products'),600);}catch(err){await handleApiError(err);}}
function openProductPreview(mode){const product=collectProduct(mode);if(!product.name||!product.slug){showToast('Add a product name and slug before previewing.','error');return;}try{sessionStorage.setItem('ciyora-product-preview',JSON.stringify(product));const url=`/product/${encodeURIComponent(product.slug)}?preview=1`;const tab=window.open(url,'_blank','noopener');if(!tab)showToast('Allow pop-ups to open the preview.','info');}catch(error){showToast('Preview could not be prepared.','error');}}
function viewLiveProduct(mode){const product=collectProduct(mode),slug=product.slug;if(!slug)return showToast('Add a slug before opening the product.','error');window.open(`/product/${encodeURIComponent(slug)}`,'_blank','noopener');}
function openEdit(id){const product=products.find(item=>Number(item.id)===Number(id));if(!product)return;editingId=Number(id);const set=(key,value)=>{if(byId(`edit-${key}`))byId(`edit-${key}`).value=value??'';};set('name',product.name);set('slug',product.slug);set('sku',product.sku);set('category',product.cat);set('desc',product.desc);set('price',product.price);set('stock',product.stockQuantity);set('material',product.material==='Not specified'?'':product.material);set('stone',product.stone);set('dimensions',product.dimensions);set('weight',product.weight==='Not specified'?'':product.weight);set('color',product.color==='Not specified'?'':product.color);byId('edit-featured').checked=Boolean(product.featured);byId('edit-new-arrival').checked=Boolean(product.newArrival);document.querySelectorAll('input[name="edit-status"]').forEach(input=>{const active=input.value===product.status;input.checked=active;input.closest('.status-opt')?.classList.toggle('active',active);});renderCategoryOptions();byId('edit-category').value=product.cat||'';renderEditPreview(product);clearSkuState('edit');goTo('edit');}
async function toggleStatus(id){const product=products.find(item=>Number(item.id)===Number(id));if(!product)return;try{await CiyoraCatalog.updateProduct({...product,status:product.status==='published'?'hidden':'published'});await reloadCatalog();showToast(product.status==='published'?'Product hidden':'Product published',product.status==='published'?'info':'success');}catch(error){await handleApiError(error);}}
function openDelete(id){deleteId=Number(id);byId('deleteModal').classList.add('open');}
function closeModal(){byId('deleteModal').classList.remove('open');deleteId=null;}
async function confirmDelete(){if(deleteId===null)return;try{await CiyoraCatalog.deleteProduct(deleteId);closeModal();await reloadCatalog();showToast('Product deleted','info');}catch(error){await handleApiError(error);}}
function selectStatus(el){el.parentElement.querySelectorAll('.status-opt').forEach(option=>option.classList.remove('active'));el.classList.add('active');el.querySelector('input').checked=true;}
function openCategoryModal(index=null){editingCategoryIndex=Number.isInteger(index)?index:null;const c=editingCategoryIndex===null?null:categories[editingCategoryIndex];byId('categoryModalTitle').textContent=c?'Edit Category':'Add Category';byId('categoryNameInput').value=c?.name||'';byId('categoryIconInput').value=c?.icon||'sparkles';byId('categoryDescriptionInput').value=c?.description||'';byId('categoryImageInput').value=c?.image||'';byId('categoryOrderInput').value=Number(c?.displayOrder||0);byId('categoryActiveInput').checked=c?.active!==false;byId('categoryFeaturedInput').checked=Boolean(c?.featured);updateCategoryImagePreview();byId('categoryModal').classList.add('open');setTimeout(()=>byId('categoryNameInput').focus(),0);}
function closeCategoryModal(){byId('categoryModal').classList.remove('open');editingCategoryIndex=null;}
function updateCategoryImagePreview(){const src=formValue('categoryImageInput');const box=byId('categoryImagePreview');if(box)box.innerHTML=src?`<img src="${escapeHtml(src)}" alt="Category preview" onerror="this.replaceChildren();this.textContent='Image unavailable'">`:'<span>Category image preview</span>';}
async function saveCategory(e){e.preventDefault();const name=formValue('categoryNameInput'),icon=formValue('categoryIconInput').toLowerCase().replace(/[^a-z0-9-]/g,'')||'folder',duplicate=categories.some((c,i)=>c.name.toLowerCase()===name.toLowerCase()&&i!==editingCategoryIndex);if(!name)return showToast('Category name is required','error');if(duplicate)return showToast('That category already exists','error');const wasEditing=editingCategoryIndex!==null;const payload={name,icon,description:formValue('categoryDescriptionInput'),image:formValue('categoryImageInput'),displayOrder:Number(formValue('categoryOrderInput')||0),active:byId('categoryActiveInput').checked,featured:byId('categoryFeaturedInput').checked};try{if(!wasEditing)await CiyoraCatalog.createCategory(payload);else await CiyoraCatalog.updateCategory({...payload,id:categories[editingCategoryIndex].id});closeCategoryModal();await reloadCatalog();showToast(wasEditing?'Category updated':'Category added','success');}catch(error){await handleApiError(error);}}
async function archiveCategory(index){const c=categories[index];if(!c)return;const next=c.active===false;if(!window.confirm(`${next?'Restore':'Archive'} “${c.name}”?`))return;try{await CiyoraCatalog.updateCategory({...c,active:next});await reloadCatalog();showToast(next?'Category restored':'Category archived','success');}catch(error){await handleApiError(error);}}
function loadSettings(){const inputs=document.querySelector('#page-settings form')?.querySelectorAll('.form-input');if(!inputs)return;inputs[0].value=settings.businessName||'Ciyora Jewels';inputs[1].value=settings.email||'';inputs[2].value=settings.instagram||'';inputs[3].value=settings.whatsapp||'';}
async function handleSaveSettings(e){e.preventDefault();const inputs=e.currentTarget.querySelectorAll('.form-input'),business={businessName:inputs[0]?.value.trim()||'Ciyora Jewels',email:inputs[1]?.value.trim()||'',instagram:inputs[2]?.value.trim()||'',whatsapp:inputs[3]?.value.trim()||''},currentPassword=inputs[4]?.value||'',newPassword=inputs[5]?.value||'',confirmPassword=inputs[6]?.value||'';try{const result=await CiyoraCatalog.saveSettings(business);settings=result.settings||business;if(currentPassword||newPassword||confirmPassword){if(newPassword.length<12)throw new Error('New password must be at least 12 characters.');if(newPassword!==confirmPassword)throw new Error('New password and confirmation do not match.');await CiyoraCatalog.changePassword({currentPassword,newPassword});inputs[4].value='';inputs[5].value='';inputs[6].value='';}showToast('Settings saved securely','success');}catch(error){await handleApiError(error);}}
function handleGlobalSearch(val){if(!val.trim())return;goTo('products');setTimeout(()=>{byId('productSearch').value=val;renderProducts();},100);}
function refreshIconsAndWarnings(){refreshIcons();updateFormWarnings();}
function bindForm(mode){const prefix=mode==='edit'?'edit':'add';byId(`${prefix}-sku`)?.addEventListener('input',()=>scheduleSkuCheck(mode));byId(`${prefix}Form`)?.addEventListener('input',refreshIconsAndWarnings);byId(`${prefix}-material`)?.addEventListener('input',refreshIconsAndWarnings);}
const uploadArea=byId('uploadArea');if(uploadArea){['dragenter','dragover'].forEach(n=>uploadArea.addEventListener(n,e=>{e.preventDefault();uploadArea.classList.add('drag');}));['dragleave','drop'].forEach(n=>uploadArea.addEventListener(n,e=>{e.preventDefault();uploadArea.classList.remove('drag');}));uploadArea.addEventListener('drop',e=>handleFiles(e.dataTransfer.files));}
byId('categoryImageInput')?.addEventListener('input',updateCategoryImagePreview);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeCategoryModal();}});byId('deleteModal')?.addEventListener('click',e=>{if(e.target.id==='deleteModal')closeModal();});byId('categoryModal')?.addEventListener('click',e=>{if(e.target.id==='categoryModal')closeCategoryModal();});
window.addEventListener('DOMContentLoaded',async()=>{refreshIcons();bindForm('add');bindForm('edit');try{const result=await CiyoraCatalog.me();await startSession(result.user);}catch(error){const localStaticPreview=error.status===404&&['localhost','127.0.0.1'].includes(window.location.hostname);if(error.status&&error.status!==401&&!localStaticPreview)showLoginError(error.message||'The admin service is unavailable.');}});
