// NazMovies — shared public-site logic
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ICONS = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.3 18.2 21l-1.6-7 5.4-4.6-7.2-.6L12 2 9.2 8.8 2 9.4 7.4 14l-1.6 7z"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg>',
};

const PLACEHOLDER_POSTER = (label) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2a35"/><stop offset="1" stop-color="#14141c"/></linearGradient></defs><rect width="300" height="450" fill="url(#g)"/><text x="150" y="232" fill="#666" font-size="46" font-family="sans-serif" text-anchor="middle">🎬</text><text x="150" y="280" fill="#888" font-size="17" font-family="sans-serif" text-anchor="middle">${(label || '').slice(0, 20)}</text></svg>`);

function posterImg(t, cls = '') {
  const name = LANG === 'ar' ? (t.title_ar || t.title) : t.title;
  const src = t.poster || PLACEHOLDER_POSTER(name);
  return `<img class="${cls}" loading="lazy" src="${src}" alt="" onerror="this.onerror=null;this.src='${PLACEHOLDER_POSTER(name)}'">`;
}
async function api(url, opts = {}) {
  const r = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (r.status === 401 && url.startsWith('/api/admin')) throw Object.assign(new Error('auth'), { code: 401 });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'err'), { code: r.status, data: j });
  return j;
}

// ---------- header ----------
function buildHeader(active = 'home') {
  const cfg = window.NAZ_CFG || {};
  const siteName = String(cfg.site_name || 'NazMovies');
  const escapeH = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const parts = siteName.split(/\s+/);
  const brandHTML = `<span class="brand">${escapeH(parts[0])}${parts.length > 1 ? `<small>${escapeH(parts.slice(1).join(' '))}</small>` : ''}</span>`;
  const logoImg = cfg.logo_url
    ? `<img src="${cfg.logo_url}" alt="" style="height:32px" onerror="this.remove()">`
    : `<svg viewBox="0 0 48 48"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e50914"/><stop offset="1" stop-color="#8f040c"/></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#lg)"/><path d="M19 14.5v19l15.5-9.5z" fill="#fff"/></svg>`;
  const root = $('#header-root');
  root.innerHTML = `
  <header id="hdr">
    <div class="logo" id="logo">
      ${logoImg}
      ${cfg.logo_url ? '' : brandHTML}
    </div>
    <nav class="main">
      <a href="/" data-nav="home">${t('home')}</a>
      <a href="/?type=movie" data-nav="movie">${t('movies')}</a>
      <a href="/?type=series" data-nav="series">${t('series')}</a>
    </nav>
    <div class="hdr-right">
      <button class="icon-btn" id="searchBtn" aria-label="search">${ICONS.search}</button>
      <button id="langBtn">${t('lang_btn')}</button>
    </div>
  </header>`;
  $$('#hdr [data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === active));
  const hdr = $('#hdr');
  addEventListener('scroll', () => hdr.classList.toggle('scrolled', scrollY > 24), { passive: true });
  hdr.classList.toggle('scrolled', scrollY > 24);
  $('#langBtn').onclick = () => { toggleLang(); location.reload(); };
  $('#searchBtn').onclick = openSearch;
  applySiteConfig();
  initAppButton();
}

// ---------- footer + page title from site config ----------
function applySiteConfig() {
  const cfg = window.NAZ_CFG || {};
  const siteName = String(cfg.site_name || 'NazMovies');
  const fb = document.querySelector('footer .f-brand');
  if (fb) fb.textContent = siteName;
  if (cfg.footer_text) {
    const note = document.querySelector('[data-i18n="footer_note"]');
    if (note) { note.textContent = cfg.footer_text; note.removeAttribute('data-i18n'); }
  }
  const foot = document.querySelector('footer');
  if (foot && !foot.querySelector('.foot-links')) {
    const spacer = foot.querySelector('.spacer');
    const links = document.createElement('span');
    links.className = 'foot-links';
    links.innerHTML = `<a href="/terms">${t('terms')}</a><a href="/privacy">${t('privacy')}</a><a href="/keywords">${t('keywords_l')}</a>`;
    foot.insertBefore(links, spacer);
  }
}

// ---------- floating app-download button (managed from admin panel) ----------
async function initAppButton() {
  try {
    const cfg = await api('/api/config');
    const a = cfg.app || {};
    if (!a.enabled || !a.url) return;
    const b = document.createElement('a');
    b.className = 'app-dl-btn';
    b.href = a.url;
    b.target = '_blank';
    b.rel = 'noopener noreferrer';
    b.innerHTML = `${ICONS.dl}<span>${String(a.text || '').trim() || (LANG === 'ar' ? 'حمّل التطبيق' : 'Get the App')}</span>`;
    document.body.appendChild(b);
  } catch { /* optional feature */ }
}

function closeModal() {
  const bk = $('#modalBk');
  if (bk) bk.remove();
  document.body.style.overflow = '';
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]') || e.target.id === 'modalBk') closeModal();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

function toast(msg, ok = true) {
  $('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.borderColor = ok ? '#2f7d43' : 'var(--red)';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ---------- cards ----------
function cardHTML(x) {
  const name = LANG === 'ar' ? (x.title_ar || x.title) : x.title;
  return `
  <div class="card" data-id="${x.id}" data-type="${x.type}">
    ${posterImg(x)}
    <span class="badge-type">${x.type === 'movie' ? t('movie') : t('serie')}</span>
    <div class="card-ov">
      <div class="t">${name}</div>
      <div class="m"><b>★ ${x.rating || '—'}</b><span>${x.year || ''}</span><span>▶ ${fmtNum(x.views)}</span></div>
      <div class="card-actions">
        <button class="mini-btn play" data-act="play" title="${t('watch_now')}">${ICONS.play}</button>
        <button class="mini-btn dl" data-act="dl" title="${t('download')}">${ICONS.dl}</button>
        <button class="mini-btn info" data-act="info" title="${t('more_info')}">${ICONS.info}</button>
      </div>
    </div>
  </div>`;
}
function wireCards(container, titlesCache) {
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    const card = e.target.closest('.card');
    if (!card) return;
    const id = +card.dataset.id;
    if (!btn || btn.dataset.act === 'info') { location.href = '/title.html?id=' + id; return; }
    e.stopPropagation();
    const full = titlesCache[id] || (titlesCache[id] = await api('/api/titles/' + id));
    const name = LANG === 'ar' ? (full.title_ar || full.title) : full.title;
    if (full.type === 'series') { location.href = '/title.html?id=' + id; return; }
    if (btn.dataset.act === 'play') openPlayer({ title: name, servers: full.servers, titleId: id });
    else openDownloads({ title: name, links: full.downloads, titleId: id });
  });
}

// ---------- player modal ----------
function openPlayer({ title, servers, titleId, episodeId, subtitle }) {
  if (!servers || !servers.length) return toast(t('no_links'), false);
  closeModal();
  const bk = document.createElement('div');
  bk.className = 'modal-bk'; bk.id = 'modalBk';
  bk.innerHTML = `
    <div class="modal">
      <div class="modal-h">
        <h4>${ICONS.play.replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-3px;color:var(--red)"')} ${title}${subtitle ? ' · <small style="color:var(--muted)">' + subtitle + '</small>' : ''}</h4>
        <button class="close-x" data-close>${ICONS.close}</button>
      </div>
      <div id="playerBox"></div>
      <div class="server-tabs" id="srvTabs">
        ${servers.map((s, i) => `<button data-i="${i}" class="${i === 0 ? 'on' : ''}">${s.name}</button>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(bk);
  document.body.style.overflow = 'hidden';
  const box = $('#playerBox', bk);
  let adMounted = false;
  const load = (i) => {
    const s = servers[i];
    $$('#srvTabs button', bk).forEach((b, bi) => b.classList.toggle('on', bi === i));
    box.innerHTML = s.kind === 'mp4'
      ? `<video class="player-frame" controls autoplay playsinline src="${s.url}"></video>`
      : `<iframe class="player-frame" src="${s.url}" allowfullscreen allow="autoplay; fullscreen" frameborder="0" referrerpolicy="no-referrer"></iframe>`;
    if (!adMounted) { adMounted = true; renderPlayerAd(box); }
  };
  $('#srvTabs', bk).onclick = (e) => { const i = e.target.closest('button')?.dataset.i; if (i !== undefined) load(+i); };
  load(0);
  api('/api/track/event', { method: 'POST', body: JSON.stringify({ kind: 'view', title_id: titleId, episode_id: episodeId || null }) }).catch(() => {});
}

// ---------- downloads modal ----------
function openDownloads({ title, links, titleId, episodeId, subtitle }) {
  if (!links || !links.length) return toast(t('no_links'), false);
  closeModal();
  const bk = document.createElement('div');
  bk.className = 'modal-bk'; bk.id = 'modalBk';
  bk.innerHTML = `
    <div class="modal small" style="width:min(560px,100%)">
      <div class="modal-h"><h4>⬇ ${title}${subtitle ? ' · <small style="color:var(--muted)">' + subtitle + '</small>' : ''}</h4>
        <button class="close-x" data-close>${ICONS.close}</button></div>
      <div class="modal-body">
        ${links.map(l => `
          <div class="dl-row">
            <span class="q-badge">${l.quality}</span>
            <span class="size">${l.size || ''}</span>
            <a class="dl-go" href="${l.url}" target="_blank" rel="noopener" download data-q="${l.quality}">${t('download')}</a>
          </div>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(bk);
  document.body.style.overflow = 'hidden';
  $$('.dl-go', bk).forEach(a => a.addEventListener('click', () => {
    api('/api/track/event', { method: 'POST', body: JSON.stringify({ kind: 'download', title_id: titleId, episode_id: episodeId || null, quality: a.dataset.q }) }).catch(() => {});
  }));
}

// ---------- search ----------
function openSearch() {
  const ov = document.createElement('div');
  ov.className = 'search-ov'; ov.id = 'searchOv';
  ov.innerHTML = `
    <button class="close-x" onclick="document.getElementById('searchOv').remove()">${ICONS.close}</button>
    <div class="search-box">${ICONS.search}<input id="searchInp" placeholder="${t('search_ph')}" autocomplete="off"></div>
    <div class="search-results"><div class="grid" id="searchGrid"></div></div>`;
  document.body.appendChild(ov);
  const inp = $('#searchInp', ov);
  inp.focus();
  const cache = {};
  let deb;
  inp.oninput = () => {
    clearTimeout(deb);
    const q = inp.value.trim();
    if (!q) { $('#searchGrid').innerHTML = ''; return; }
    deb = setTimeout(async () => {
      const rows = await api('/api/titles?q=' + encodeURIComponent(q));
      const grid = $('#searchGrid');
      grid.innerHTML = rows.length ? rows.map(cardHTML).join('') : `<div class="empty" style="grid-column:1/-1">${t('no_results')}</div>`;
    }, 250);
  };
  wireCards($('#searchGrid'), cache);
  inp.onkeydown = (e) => { if (e.key === 'Escape') ov.remove(); };
}

// ---------- tracking & ads ----------
function initTracking() {
  let v = localStorage.getItem('naz_vid');
  if (!v) { v = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('naz_vid', v); }
  api('/api/track/visit', { method: 'POST', body: JSON.stringify({ visitor: v, path: location.pathname + location.search }) }).catch(() => {});
}
function mountAdHtml(holder, html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  [...doc.body.children].forEach(el => {
    if (el.tagName === 'SCRIPT') {
      const s = document.createElement('script');
      [...el.attributes].forEach(at => s.setAttribute(at.name, at.value));
      s.textContent = el.textContent;
      holder.appendChild(s);
    } else {
      holder.appendChild(el.cloneNode(true));
    }
  });
}
async function injectAds() {
  let cfg;
  try { cfg = await api('/api/ads'); } catch { return; }
  window.NAZ_ADS = cfg;
  // ---- banner ads ----
  (cfg.banners || []).forEach(b => {
    const holder = document.createElement('div');
    holder.className = 'ad-banner ad-banner-' + (b.position || 'top');
    mountAdHtml(holder, b.code);
    if (b.position === 'bottom') document.body.appendChild(holder);
    else {
      const anchor = document.getElementById('header-root') || document.body.firstChild;
      anchor ? anchor.insertAdjacentElement('afterend', holder) : document.body.prepend(holder);
    }
  });
  // ---- popunder with per-user frequency ----
  const p = cfg.popunder || {};
  if (p.enabled && (p.code || '').trim()) {
    const freqMs = Math.max(1, +p.freq_hours || 24) * 3600e3;
    const last = +localStorage.getItem('naz_pop_ts') || 0;
    if (Date.now() - last > freqMs) {
      localStorage.setItem('naz_pop_ts', Date.now());
      const holder = document.createElement('div');
      holder.style.display = 'none';
      document.body.appendChild(holder);
      mountAdHtml(holder, p.code);
    }
  }
}
// player ad strip (text link or ad code) placed above/below the video
function renderPlayerAd(playerBox) {
  const p = (window.NAZ_ADS || {}).player;
  if (!p || !p.enabled || !(p.content || '').trim()) return;
  const strip = document.createElement('div');
  strip.className = 'player-ad';
  if (p.mode === 'code') mountAdHtml(strip, p.content);
  else strip.innerHTML = `<span class="ad-tag">${LANG === 'ar' ? 'إعلان' : 'AD'}</span>
    <a href="${p.link || '#'}" ${p.link ? 'target="_blank" rel="nofollow noopener"' : ''}>${String(p.content).replace(/</g, '&lt;')}</a>`;
  if (p.position === 'above') playerBox.prepend(strip);
  else playerBox.append(strip);
}
