// NazMovies — homepage
(async function () {
  await initLang();
  const SITE = (window.NAZ_CFG && window.NAZ_CFG.site_name) || 'NazMovies';
  document.title = LANG === 'ar' ? SITE + ' — شاهد وحمل' : SITE + ' — Watch & Download';
  document.getElementById('yr').textContent = new Date().getFullYear();

  const params = new URLSearchParams(location.search);
  const type = params.get('type'); // null | movie | series
  buildHeader(type || 'home');
  translateStatic();

  const app = document.getElementById('app');
  const titlesCache = {};
  const data = await api('/api/home');

  if (type) {
    renderBrowse(type);
  } else {
    renderHome(data);
  }
  initTracking();
  injectAds();

  function renderHome(data) {
    const feat = data.featured.length ? data.featured : data.rows[0].items.slice(0, 3);
    app.innerHTML = `
      <section class="hero" id="hero">
        <div class="hero-bg"><img id="heroImg" alt=""></div>
        <div class="hero-shade"></div>
        <div class="hero-content">
          <div class="hero-badge" id="heroBadge">${t('featured_tag')}</div>
          <h1 class="hero-title" id="heroTitle"></h1>
          <div class="hero-meta" id="heroMeta"></div>
          <p class="hero-overview" id="heroOv"></p>
          <div class="hero-actions">
            <button class="btn btn-play" id="heroPlay">${ICONS.play}<span>${t('watch_now')}</span></button>
            <button class="btn btn-dl" id="heroDl">${ICONS.dl}<span>${t('download')}</span></button>
            <button class="btn btn-ghost" id="heroInfo">${ICONS.info}<span>${t('more_info')}</span></button>
          </div>
        </div>
        <div class="hero-dots" id="heroDots"></div>
      </section>
      <div class="rows" id="rows"></div>`;

    // ---- hero rotation ----
    let cur = 0, timer;
    const dots = document.getElementById('heroDots');
    dots.innerHTML = feat.map((_, i) => `<button data-i="${i}"></button>`).join('');
    dots.onclick = (e) => { const i = e.target.dataset.i; if (i !== undefined) { show(+i); restart(); } };
    async function show(i) {
      cur = i;
      const x = feat[i];
      const full = titlesCache[x.id] || (titlesCache[x.id] = await api('/api/titles/' + x.id));
      const name = LANG === 'ar' ? (x.title_ar || x.title) : x.title;
      const ov = LANG === 'ar' ? (x.overview_ar || x.overview) : x.overview;
      const img = document.getElementById('heroImg');
      img.src = x.backdrop || x.poster || PLACEHOLDER_POSTER(name);
      img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER_POSTER(name); };
      document.getElementById('heroTitle').textContent = name;
      document.getElementById('heroOv').textContent = ov || '';
      document.getElementById('heroMeta').innerHTML = `
        <span class="match">${Math.round((x.rating || 0) * 10)}% ★</span>
        <span>${x.year || ''}</span>
        ${x.runtime ? `<span>${x.runtime} ${t('min')}</span>` : ''}
        <span>${x.genres.map(genreName).join(' · ')}</span>`;
      document.getElementById('heroPlay').onclick = () => {
        if (full.type === 'series') location.href = '/title.html?id=' + x.id;
        else openPlayer({ title: name, servers: full.servers, titleId: x.id });
      };
      document.getElementById('heroDl').onclick = () => {
        if (full.type === 'series') location.href = '/title.html?id=' + x.id;
        else openDownloads({ title: name, links: full.downloads, titleId: x.id });
      };
      document.getElementById('heroInfo').onclick = () => location.href = '/title.html?id=' + x.id;
      [...dots.children].forEach((d, di) => d.classList.toggle('on', di === i));
    }
    function restart() { clearInterval(timer); timer = setInterval(() => show((cur + 1) % feat.length), 8000); }
    if (feat.length) { show(0); restart(); }

    // ---- rows ----
    const rowsEl = document.getElementById('rows');
    rowsEl.innerHTML = data.rows.map(r => `
      <section class="row">
        <h3>${t('r_' + r.key)} <span class="count">${r.items.length} ${t('items')}</span></h3>
        <div class="scroller-wrap">
          <button class="row-arrow prev">${ICONS.chev}</button>
          <div class="scroller">${r.items.map(cardHTML).join('')}</div>
          <button class="row-arrow next">${ICONS.chev}</button>
        </div>
      </section>`).join('');
    wireCards(rowsEl, titlesCache);
    $$('.scroller-wrap').forEach(w => {
      const sc = $('.scroller', w);
      const step = () => sc.clientWidth * 0.8;
      $('.prev', w).onclick = () => sc.scrollBy({ left: (document.dir === 'rtl' ? 1 : -1) * step() });
      $('.next', w).onclick = () => sc.scrollBy({ left: (document.dir === 'rtl' ? -1 : 1) * step() });
    });
  }

  async function renderBrowse(type) {
    const rows = await api('/api/titles?type=' + type);
    app.innerHTML = `
      <section class="section">
        <h2>${type === 'movie' ? t('browse_movies') : t('browse_series')}</h2>
        <div class="grid" id="browseGrid">
          ${rows.length ? rows.map(cardHTML).join('') : `<div class="empty" style="grid-column:1/-1">${t('no_results')}</div>`}
        </div>
      </section>`;
    wireCards(document.getElementById('browseGrid'), titlesCache);
  }
})();
