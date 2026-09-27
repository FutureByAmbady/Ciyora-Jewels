(() => {
  let products = [], categories = [], catalogSettings = {};
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const slugify = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const grid = document.getElementById('productsGrid');
  const routeView = () => { let el=document.getElementById('routeView'); if(!el){el=document.createElement('section');el.id='routeView';el.className='container'; const anchor=document.getElementById('new'); anchor?.parentNode.insertBefore(el,anchor); } return el; };
  const waNumber = () => { let digits=String(catalogSettings.whatsapp || '').replace(/\D/g,''); if(!digits) return ''; while(digits.startsWith('9191') && digits.length>12) digits=digits.slice(2); return digits.length===10 ? `91${digits}` : digits; };
  const instagramUrl = () => { const value=String(catalogSettings.instagram || '').trim(); if(!value) return ''; return /^https?:\/\//i.test(value) ? value : `https://instagram.com/${value.replace(/^@/,'')}`; };
  const waLink = p => { const number=waNumber(); if(!number) return '#'; const message=`Hello, I would like to enquire about this product.\n\nProduct: ${p.name}\nSKU: ${p.sku || 'Not specified'}\nPrice: ${p.price}\nProduct link: ${location.origin}/product/${p.slug || slugify(p.name)}\n\nThank you.`; return `https://wa.me/${number}?text=${encodeURIComponent(message)}`; };
  function applyBusinessSettings(){
    const ig=instagramUrl(), phone=String(catalogSettings.whatsapp || '').trim(), email=String(catalogSettings.email || '').trim();
    document.querySelectorAll('[data-business-instagram]').forEach(el=>{el.href=ig||'#';el.hidden=!ig;});
    document.querySelectorAll('[data-business-whatsapp]').forEach(el=>{el.href=phone?`https://wa.me/${waNumber()}`:'#';el.hidden=!phone;});
    document.querySelectorAll('[data-business-email]').forEach(el=>{el.href=email?`mailto:${email}`:'#';el.hidden=!email;});
    document.querySelectorAll('[data-business-whatsapp-label]').forEach(el=>{el.textContent=phone;el.parentElement?.parentElement?.toggleAttribute('hidden',!phone);});
    document.querySelectorAll('[data-business-email-label]').forEach(el=>{el.textContent=email;el.parentElement?.parentElement?.toggleAttribute('hidden',!email);});
  }
  const image = p => p.img || (p.imgs || [])[0] || '';
  const favs = () => JSON.parse(localStorage.getItem('ciyora-favorites') || '[]');
  const cart = () => JSON.parse(localStorage.getItem('ciyora-cart') || '[]');
  const saveCart = value => localStorage.setItem('ciyora-cart', JSON.stringify(value));
  const setPageMode = mode => { ['.hero','#collections','#about','#instagram','.testimonials','footer'].forEach(sel => document.querySelectorAll(sel).forEach(el => el.style.display = mode === 'home' ? '' : 'none')); const n=document.getElementById('new'); if(n) n.style.display=mode==='home'?'':'none'; routeView().style.display=mode==='home'?'none':''; };

  function renderCategories(){
    const box=document.querySelector('.categories-grid'); if(!box) return;
    box.innerHTML=categories.filter(c=>c.active!==false).map(c=>`<div class="cat-card reveal" onclick="filterCategory('${escapeHtml(c.slug)}')"><img src="${escapeHtml(c.image || image(products.find(p=>slugify(p.cat)===c.slug) || {}))}" alt="${escapeHtml(c.name)}" loading="lazy"><div class="cat-overlay"><div class="arrow"><i data-lucide="arrow-up-right"></i></div><span>${Number(c.count||0)} Pieces</span><h3>${escapeHtml(c.name)}</h3></div></div>`).join('');
    if(window.lucide) lucide.createIcons();
    if(typeof observeReveals === 'function') observeReveals();
  }

  function renderProducts(list=products,target=grid){
    if(!target) return;
    target.innerHTML=list.map(p=>{const isFav=favs().includes(Number(p.id));const sold=Number(p.stockQuantity||0)===0 && p.stockStatus==='out_of_stock';return `<div class="product-card reveal" onclick="openProduct('${escapeHtml(p.slug || slugify(p.name))}')"><div class="product-img">${p.badge?`<span class="product-badge">${escapeHtml(p.badge)}</span>`:''}${sold?'<span class="product-badge" style="left:auto;right:12px;background:#222">SOLD OUT</span>':''}<button class="product-fav ${isFav?'active':''}" onclick="event.stopPropagation();toggleFav(this,${Number(p.id)})" aria-label="Favorite"><i data-lucide="heart"></i></button><img src="${escapeHtml(image(p))}" alt="${escapeHtml(p.name)}" loading="lazy"></div><div class="product-info"><div class="product-cat">${escapeHtml(p.cat)}</div><h3>${escapeHtml(p.name)}</h3><p class="desc">${escapeHtml((p.shortDescription||p.desc||'').slice(0,80))}${(p.desc||'').length>80?'...':''}</p><div class="product-bottom"><div class="product-price">${escapeHtml(p.price)}</div><div class="product-actions"><a href="${escapeHtml(instagramUrl()||'#')}" target="_blank" class="icon-btn" onclick="event.stopPropagation()" aria-label="Instagram"><i data-lucide="instagram"></i></a><a href="${escapeHtml(waLink(p))}" target="_blank" class="icon-btn" onclick="event.stopPropagation()" aria-label="WhatsApp"><i data-lucide="message-circle"></i></a></div></div></div></div>`}).join('') || '<div class="empty-state">No products are available here yet.</div>';
    if(window.lucide) lucide.createIcons();
    if(typeof observeReveals === 'function') observeReveals();
  }

  function renderProduct(p){
    setPageMode('product'); const view=routeView(); const imgs=(p.imgs&&p.imgs.length?p.imgs:[image(p)]).filter(Boolean); document.title=`${p.name} — Ciyora Jewels`;
    view.innerHTML=`<div style="padding:120px 0 80px"><a href="/" style="color:var(--gold);font-size:13px">← Back to collection</a><div class="product-modal-grid" style="margin-top:24px"><div class="pm-gallery"><div class="pm-main-img"><img id="routeMainImage" src="${escapeHtml(imgs[0]||'')}" alt="${escapeHtml(p.name)}"></div><div class="pm-thumbs">${imgs.map((src,i)=>`<div class="pm-thumb ${i===0?'active':''}" onclick="changeRouteThumb('${encodeURIComponent(src)}',this)"><img src="${escapeHtml(src)}" alt=""></div>`).join('')}</div></div><div class="pm-details"><div class="product-cat">${escapeHtml(p.cat)}</div><h2>${escapeHtml(p.name)}</h2><div class="pm-price">${escapeHtml(p.price)}</div>${p.compareAtPrice?`<div style="text-decoration:line-through;color:var(--muted)">${escapeHtml(p.compareAtPrice)}</div>`:''}<p class="pm-desc">${escapeHtml(p.desc||p.shortDescription)}</p><div class="pm-specs">${[['SKU',p.sku],['Material',p.material],['Stone',p.stone],['Colour',p.color],['Weight',p.weight],['Dimensions',p.dimensions],['Availability',p.stockStatus==='out_of_stock'?'Sold out':p.stockStatus==='low_stock'?'Low stock':'In stock']].filter(([,value])=>value && value!=='Not specified').map(([label,value])=>`<div class="pm-spec"><div class="pm-spec-label">${label}</div><div class="pm-spec-value">${escapeHtml(value)}</div></div>`).join('')}</div><div class="pm-sizes"><h4>Available Sizes</h4><div class="pm-size-options">${(p.sizes||['One Size']).map((s,i)=>`<div class="pm-size ${i===0?'active':''}">${escapeHtml(s)}</div>`).join('')}</div></div><div class="pm-actions"><button class="btn btn-secondary" onclick="toggleRouteFav(${Number(p.id)},this)"><i data-lucide="heart"></i> ${favs().includes(Number(p.id))?'Saved':'Add to Wishlist'}</button><a href="${escapeHtml(waLink(p))}" target="_blank" class="btn btn-wa" ${waNumber()?'':'aria-disabled="true" onclick="event.preventDefault();showToast(\'WhatsApp contact is not configured yet\',false)"'}><i data-lucide="message-circle"></i> Enquire on WhatsApp</a></div><p style="margin-top:24px;color:var(--muted);font-size:13px">${escapeHtml(p.shippingInformation||'Contact us for shipping and care information.')}</p></div></div></div>`;
    if(window.lucide) lucide.createIcons(); if(typeof observeReveals === 'function') observeReveals(); window.scrollTo({top:0,behavior:'smooth'});
  }
  function changeRouteThumb(src,el){document.getElementById('routeMainImage').src=decodeURIComponent(src);document.querySelectorAll('#routeView .pm-thumb').forEach(x=>x.classList.remove('active'));el.classList.add('active');}

  function renderWishlist(){
    setPageMode('wishlist'); const view=routeView(); const saved=products.filter(p=>favs().includes(Number(p.id))); document.title='Wishlist — Ciyora Jewels';
    view.innerHTML=`<div style="padding:120px 0 80px"><h1 style="font-family:var(--serif)">Your Wishlist</h1><p style="color:var(--muted);margin-top:10px">Saved privately in this browser.</p><div class="products-grid" id="routeGrid" style="margin-top:28px"></div></div>`; renderProducts(saved,document.getElementById('routeGrid'));
  }
  function renderCart(){ renderWishlist(); }
  function changeCart(id,delta){const next=cart().map(i=>Number(i.id)===Number(id)?{...i,qty:Math.max(1,i.qty+delta)}:i);saveCart(next);renderCart();}
  function removeCart(id){saveCart(cart().filter(i=>Number(i.id)!==Number(id)));renderCart();}
  function addToCart(id){const next=cart();const found=next.find(i=>Number(i.id)===Number(id));if(found)found.qty++;else next.push({id:Number(id),qty:1});saveCart(next);showToast('Added to cart',true);}

  function renderRoute(){
    const path=location.pathname.replace(/\/$/,'')||'/'; const q=new URLSearchParams(location.search).get('q')||'';
    if(path==='/wishlist'||path==='/saved'){renderWishlist();return;}
    if(path==='/cart'||path==='/bag'||(path==='/'&&new URLSearchParams(location.search).get('view')==='cart')){renderWishlist();return;}
    if(path.startsWith('/product/')){const slug=decodeURIComponent(path.split('/').pop());const p=products.find(x=>(x.slug||slugify(x.name))===slug);if(p)renderProduct(p);else{setPageMode('product');routeView().innerHTML='<div style="padding:140px 0;text-align:center"><h2>Product unavailable</h2><a href="/">Return to collection</a></div>';}return;}
    if(path.startsWith('/category/')){const slug=decodeURIComponent(path.split('/').pop());const c=categories.find(x=>x.slug===slug);setPageMode('category');const list=c?products.filter(p=>slugify(p.cat)===slug||p.cat===c.name):[];document.title=`${c?.name||'Collection'} — Ciyora Jewels`;routeView().innerHTML=`<div style="padding:120px 0 30px"><a href="/" style="color:var(--gold);font-size:13px">← All collections</a><span class="section-tag" style="display:block;margin-top:24px">Collection</span><h1 style="font-family:var(--serif)">${escapeHtml(c?.name||'Collection')}</h1><p style="color:var(--muted)">${escapeHtml(c?.description||'Explore our curated jewellery collection.')}</p><p style="color:var(--muted);font-size:13px">${list.length} Pieces</p><div class="products-grid" id="routeGrid"></div></div>`;renderProducts(list,document.getElementById('routeGrid'));return;}
    if(path==='/search'||(path==='/'&&q)){setPageMode('search');const needle=q.toLowerCase();const list=products.filter(p=>[p.name,p.slug,p.sku,p.cat,p.material,p.desc].join(' ').toLowerCase().includes(needle));routeView().innerHTML=`<div style="padding:120px 0 30px"><span class="section-tag">Search</span><h1 style="font-family:var(--serif)">Results for “${escapeHtml(q)}”</h1><p style="color:var(--muted)">${list.length} product${list.length===1?'':'s'} found</p><div class="products-grid" id="routeGrid"></div></div>`;renderProducts(list,document.getElementById('routeGrid'));return;}
    setPageMode('home'); document.title='Ciyora Jewels — Luxury Jewelry Catalog'; const arrivals=products.filter(p=>p.newArrival||p.badge==='New');renderProducts(arrivals.length?arrivals:products);
  }

  async function loadCatalog(){try{const payload=await CiyoraCatalog.getPublicCatalog();products=payload.products||[];categories=payload.categories||[];catalogSettings=payload.settings||{};const preview=new URLSearchParams(location.search).get('preview')==='1'&&location.pathname.startsWith('/product/');if(preview){try{const draft=JSON.parse(sessionStorage.getItem('ciyora-product-preview')||'null');const slug=decodeURIComponent(location.pathname.split('/').pop());if(draft&&(draft.slug===slug||slugify(draft.name)===slug)){products=[...products.filter(p=>p.slug!==slug),{...draft,slug:slug||draft.slug,shortDescription:draft.desc}];}}catch(error){console.warn('Preview data could not be read',error);}}applyBusinessSettings();renderCategories();renderRoute();}catch(error){console.error(error);if(grid)grid.innerHTML='<div class="empty-state">Our collection is temporarily unavailable. Please try again soon.</div>';}}
  function openProduct(slug){const p=products.find(x=>Number(x.id)===Number(slug)||x.slug===slug||slugify(x.name)===slug);if(p)location.href=`/product/${encodeURIComponent(p.slug||slugify(p.name))}`;}
  function filterCategory(slug){location.href=`/category/${encodeURIComponent(slug)}`;}
  function toggleFav(btn,id){let next=favs();const n=Number(id);next=next.includes(n)?next.filter(x=>x!==n):[...next,n];localStorage.setItem('ciyora-favorites',JSON.stringify(next));btn.classList.toggle('active',next.includes(n));showToast(next.includes(n)?'Added to wishlist':'Removed from wishlist',next.includes(n));}
  function toggleRouteFav(id,btn){let next=favs();const n=Number(id);next=next.includes(n)?next.filter(x=>x!==n):[...next,n];localStorage.setItem('ciyora-favorites',JSON.stringify(next));btn.innerHTML=`<i data-lucide="heart"></i> ${next.includes(n)?'Saved':'Add to Wishlist'}`;if(window.lucide)lucide.createIcons();showToast(next.includes(n)?'Added to wishlist':'Removed from wishlist',next.includes(n));}
  function showToast(msg,success){const t=document.createElement('div');t.className='toast'+(success?' success':'');t.innerHTML=`<i data-lucide="${success?'check':'info'}"></i><span>${escapeHtml(msg)}</span>`;document.getElementById('toastContainer')?.appendChild(t);if(window.lucide)lucide.createIcons();setTimeout(()=>t.remove(),2600);}
  function openSearch(){document.getElementById('searchModal')?.classList.add('open');document.body.style.overflow='hidden';setTimeout(()=>document.getElementById('searchInput')?.focus(),100);}
  function closeSearch(){document.getElementById('searchModal')?.classList.remove('open');document.body.style.overflow='';}
  function handleSearch(q){if(q.trim())location.href=`/search?q=${encodeURIComponent(q.trim())}`;}
  document.querySelector('.nav-icons')?.insertAdjacentHTML('beforeend','<a href="/wishlist" class="nav-icon" aria-label="Wishlist"><i data-lucide="heart"></i></a>');
  window.addEventListener('popstate',renderRoute); window.addEventListener('DOMContentLoaded',()=>{if(window.lucide)lucide.createIcons();});
  loadCatalog();
  const track=document.getElementById('testiTrack'),dots=document.getElementById('testiDots'); if(track&&dots){let slide=0;for(let i=0;i<track.children.length;i++){const d=document.createElement('div');d.className='testi-dot'+(!i?' active':'');d.onclick=()=>{slide=i;track.style.transform=`translateX(-${i*100}%)`;document.querySelectorAll('.testi-dot').forEach((x,j)=>x.classList.toggle('active',j===i));};dots.appendChild(d);}setInterval(()=>{slide=(slide+1)%track.children.length;track.style.transform=`translateX(-${slide*100}%)`;},5500);}
  const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.12});
  const observeReveals=()=>document.querySelectorAll('.reveal:not(.visible)').forEach(e=>observer.observe(e));
  observeReveals();
  window.addEventListener('scroll',()=>{const nav=document.getElementById('nav');if(nav)nav.style.background=scrollY>50?'rgba(17,17,17,.95)':'rgba(17,17,17,.85)';});
  document.querySelectorAll('#categoryFilters .filter-chip').forEach(chip=>chip.addEventListener('click',()=>{const value=chip.dataset.cat;if(value==='All') return; location.href=`/category/${encodeURIComponent(slugify(value))}`;}));
  document.querySelectorAll('#materialFilters .filter-chip').forEach(chip=>chip.addEventListener('click',()=>{const value=chip.dataset.mat;if(value!=='All') location.href=`/search?q=${encodeURIComponent(value)}`;}));
  window.CiyoraStore={addToCart,renderCart,renderWishlist}; window.openProduct=openProduct;window.filterCategory=filterCategory;window.toggleFav=toggleFav;window.toggleRouteFav=toggleRouteFav;window.openSearch=openSearch;window.closeSearch=closeSearch;window.handleSearch=handleSearch;window.addToCart=addToCart;window.changeCart=changeCart;window.removeCart=removeCart;window.changeRouteThumb=changeRouteThumb;window.showToast=showToast;
})();
