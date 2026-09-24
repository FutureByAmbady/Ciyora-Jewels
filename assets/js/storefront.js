  let products = [];
  let catalogSettings = {};

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[char]));
  const grid = document.getElementById('productsGrid');

  function renderProducts(){
    if(!grid) return;
    grid.innerHTML = products.map(p => `
      <div class="product-card reveal" onclick="openProduct(${Number(p.id)})">
        <div class="product-img">
          ${p.badge ? `<span class="product-badge">${escapeHtml(p.badge)}</span>` : ''}
          <button class="product-fav" onclick="event.stopPropagation();toggleFav(this)" aria-label="Favorite"><i data-lucide="heart"></i></button>
          <img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}" loading="lazy">
        </div>
        <div class="product-info">
          <div class="product-cat">${escapeHtml(p.cat)}</div>
          <h3>${escapeHtml(p.name)}</h3>
          <p class="desc">${escapeHtml((p.desc || '').slice(0,70))}${(p.desc || '').length > 70 ? '...' : ''}</p>
          <div class="product-bottom">
            <div class="product-price">${escapeHtml(p.price)}</div>
            <div class="product-actions">
              <a href="https://instagram.com/ciyorajewels" target="_blank" class="icon-btn" onclick="event.stopPropagation()" aria-label="Instagram"><i data-lucide="instagram"></i></a>
              <a href="https://wa.me/1234567890?text=Hi! I'm interested in ${encodeURIComponent(p.name)}" target="_blank" class="icon-btn" onclick="event.stopPropagation()" aria-label="WhatsApp"><i data-lucide="message-circle"></i></a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
  }

  async function loadCatalog(){
    try {
      const payload = await CiyoraCatalog.getPublicCatalog();
      products = payload.products || [];
      catalogSettings = payload.settings || {};
      renderProducts();
    } catch(error) {
      console.error('Ciyora catalog could not be loaded.', error);
      if(grid) grid.innerHTML = '<div class="empty-state">Our collection is temporarily unavailable. Please try again soon.</div>';
    }
  }

  loadCatalog();
  // ===== PRODUCT MODAL =====
  function openProduct(id){
    const p = products.find(x => Number(x.id) === Number(id));
    if(!p) return;
    const images = Array.isArray(p.imgs) && p.imgs.length ? p.imgs : (p.img ? [p.img] : []);
    const related = products.filter(x => x.cat === p.cat && Number(x.id) !== Number(p.id)).slice(0,4);
    document.getElementById('productModalContent').innerHTML = `
      <div class="pm-gallery">
        <div class="pm-main-img" id="pmMainImg"><img src="${escapeHtml(images[0] || '')}" alt="${escapeHtml(p.name)}"></div>
        <div class="pm-thumbs">${images.map((img,i) => `<div class="pm-thumb ${i===0?'active':''}" onclick="changeThumb('${encodeURIComponent(img)}',this)"><img src="${escapeHtml(img)}" alt=""></div>`).join('')}</div>
      </div>
      <div class="pm-details">
        <div class="product-cat">${escapeHtml(p.cat)}</div><h2>${escapeHtml(p.name)}</h2>
        <div class="pm-rating"><div class="stars"><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i></div><span>4.9 (128 reviews)</span></div>
        <div class="pm-price">${escapeHtml(p.price)}</div>
        <p class="pm-desc">${escapeHtml(p.desc)} Each piece is handcrafted by our master artisans using ethically sourced materials, ensuring exceptional quality and timeless beauty.</p>
        <div class="pm-specs"><div class="pm-spec"><div class="pm-spec-label">Material</div><div class="pm-spec-value">${escapeHtml(p.material)}</div></div><div class="pm-spec"><div class="pm-spec-label">Color</div><div class="pm-spec-value">${escapeHtml(p.color)}</div></div><div class="pm-spec"><div class="pm-spec-label">Weight</div><div class="pm-spec-value">${escapeHtml(p.weight)}</div></div><div class="pm-spec"><div class="pm-spec-label">Category</div><div class="pm-spec-value">${escapeHtml(p.cat)}</div></div></div>
        <div class="pm-sizes"><h4>Available Sizes</h4><div class="pm-size-options">${(p.sizes || ['One Size']).map((s,i) => `<div class="pm-size ${i===0?'active':''}" onclick="selectSize(this)">${escapeHtml(s)}</div>`).join('')}</div></div>
        <div class="pm-actions"><a href="https://instagram.com/ciyorajewels" target="_blank" class="btn btn-ig"><i data-lucide="instagram"></i> View on Instagram</a><a href="https://wa.me/1234567890?text=Hi! I'd like to enquire about ${encodeURIComponent(p.name)}" target="_blank" class="btn btn-wa"><i data-lucide="message-circle"></i> Chat on WhatsApp</a></div>
        ${related.length ? `<div style="margin-top:36px;padding-top:28px;border-top:1px solid var(--line)"><h4 style="font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-bottom:18px;font-family:'Inter',sans-serif;font-weight:600">You May Also Like</h4><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">${related.map(r => `<div onclick="openProduct(${Number(r.id)})" style="cursor:pointer;display:flex;gap:12px;padding:10px;border-radius:10px"><img src="${escapeHtml(r.img)}" style="width:60px;height:60px;border-radius:8px;object-fit:cover"><div><div style="font-size:13px;font-weight:600;color:var(--black);font-family:'Inter',sans-serif">${escapeHtml(r.name)}</div><div style="font-size:12px;color:var(--gold);margin-top:2px">${escapeHtml(r.price)}</div></div></div>`).join('')}</div></div>` : ''}
      </div>`;
    document.getElementById('productModal').classList.add('open');
    document.body.style.overflow = 'hidden';
    if(window.lucide) lucide.createIcons();
  }  function closeProductModal(){
    document.getElementById('productModal').classList.remove('open');
    document.body.style.overflow = '';
  }
  function changeThumb(src,el){
    document.getElementById('pmMainImg').querySelector('img').src = decodeURIComponent(src);
    document.querySelectorAll('.pm-thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
  function selectSize(el){
    el.parentElement.querySelectorAll('.pm-size').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
  }

  // ===== SEARCH =====
  let activeCat = 'All', activeMat = 'All';
  function openSearch(){
    document.getElementById('searchModal').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('searchInput').focus(), 100);
    if(window.lucide) lucide.createIcons();
  }
  function closeSearch(){
    document.getElementById('searchModal').classList.remove('open');
    document.body.style.overflow = '';
  }
  document.getElementById('categoryFilters').addEventListener('click', e => {
    if(e.target.classList.contains('filter-chip')){
      document.querySelectorAll('#categoryFilters .filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      activeCat = e.target.dataset.cat;
      handleSearch(document.getElementById('searchInput').value);
    }
  });
  document.getElementById('materialFilters').addEventListener('click', e => {
    if(e.target.classList.contains('filter-chip')){
      document.querySelectorAll('#materialFilters .filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      activeMat = e.target.dataset.mat;
      handleSearch(document.getElementById('searchInput').value);
    }
  });
  function handleSearch(q){
    const query = q.toLowerCase().trim();
    const results = products.filter(p => {
      const matchQ = !query || p.name.toLowerCase().includes(query) || p.cat.toLowerCase().includes(query) || p.material.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query);
      const matchCat = activeCat === 'All' || p.cat === activeCat;
      const matchMat = activeMat === 'All' || p.material.includes(activeMat);
      return matchQ && matchCat && matchMat;
    });
    const box = document.getElementById('searchResults');
    const list = document.getElementById('searchResultList');
    if(query || activeCat !== 'All' || activeMat !== 'All'){
      box.style.display = 'block';
      if(results.length === 0){
        list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:14px">No products found</div>';
      } else {
        list.innerHTML = results.map(p => `
          <div class="search-result-item" onclick="closeSearch();openProduct(${p.id})">
            <img src="${p.img}" alt="">
            <div class="info"><h5>${p.name}</h5><span>${p.cat} Â· ${p.price}</span></div>
          </div>
        `).join('');
      }
    } else {
      box.style.display = 'none';
    }
  }
  function filterCategory(cat){
    document.getElementById('new').scrollIntoView({behavior:'smooth'});
    setTimeout(() => {
      document.querySelectorAll('#categoryFilters .filter-chip').forEach(c => c.classList.remove('active'));
      const chip = document.querySelector(`#categoryFilters .filter-chip[data-cat="${cat}"]`);
      if(chip){chip.classList.add('active');activeCat = cat;}
      handleSearch('');
    }, 600);
  }

  // ===== FAVORITES =====
  function toggleFav(btn){
    btn.classList.toggle('active');
    showToast(btn.classList.contains('active') ? 'Added to favorites' : 'Removed from favorites', btn.classList.contains('active'));
  }
  function showToast(msg, success){
    const t = document.createElement('div');
    t.className = 'toast' + (success ? ' success' : '');
    t.innerHTML = `<i data-lucide="${success ? 'heart' : 'info'}"></i><span>${msg}</span>`;
    document.getElementById('toastContainer').appendChild(t);
    if(window.lucide) lucide.createIcons();
    setTimeout(() => {t.style.opacity = '0';t.style.transform = 'translateX(100%)';t.style.transition = 'all .4s';setTimeout(() => t.remove(), 400);}, 2500);
  }

  // ===== TESTIMONIALS CAROUSEL =====
  const track = document.getElementById('testiTrack');
  const dotsBox = document.getElementById('testiDots');
  const totalSlides = track.children.length;
  let currentSlide = 0;
  for(let i=0;i<totalSlides;i++){
    const d = document.createElement('div');
    d.className = 'testi-dot' + (i===0?' active':'');
    d.onclick = () => goToSlide(i);
    dotsBox.appendChild(d);
  }
  function goToSlide(i){
    currentSlide = i;
    track.style.transform = `translateX(-${i*100}%)`;
    document.querySelectorAll('.testi-dot').forEach((d,idx) => d.classList.toggle('active', idx === i));
  }
  setInterval(() => goToSlide((currentSlide+1) % totalSlides), 5500);

  // ===== REVEAL ON SCROLL =====
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, {threshold:0.12});
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // ===== NAV SCROLL =====
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('nav');
    nav.style.background = window.scrollY > 50 ? 'rgba(17,17,17,.95)' : 'rgba(17,17,17,.85)';
    const sections = ['home','collections','new','about','contact'];
    const items = document.querySelectorAll('.bottom-nav-item');
    let current = 0;
    sections.forEach((id,i) => {
      const el = document.getElementById(id);
      if(el && window.scrollY >= el.offsetTop - 200) current = i;
    });
    items.forEach((it,i) => it.classList.toggle('active', i === current));
  });

  // ===== CLOSE MODALS ON ESC / BACKDROP =====
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){closeProductModal();closeSearch();}
  });
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => {
      if(e.target === m){closeProductModal();closeSearch();}
    });
  });

  // Init icons
  const initIcons = () => { if(window.lucide) lucide.createIcons(); };
  initIcons();
  window.addEventListener('DOMContentLoaded', initIcons);



