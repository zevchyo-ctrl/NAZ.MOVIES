// NazMovies — simplified admin panel (Content + Ads only, mobile-first)
(async function () {
  await initLang();
  const root = document.getElementById('adminRoot');
  const aapi = (url, opts = {}) => api(url, {
    ...opts,
    headers: { 'x-admin-token': localStorage.getItem('naz_admin'), ...(opts.headers || {}) },
  });

  // ---------- gate (passcode verified on server only — never stored in this file) ----------
  try { await aapi('/api/admin/me'); }
  catch { renderLogin(); return; }

  const GENRE_LIST = [28, 12, 16, 35, 80, 18, 27, 878, 53, 36, 10749, 14, 9648];
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  renderShell();
  showTab('content');

  function renderLogin() {
    root.innerHTML = `
    <div class="admin-login">
      <div class="modal small" style="position:static">
        <div class="modal-h" style="justify-content:center">
          <h4>🔒 ${t('login_admin')}</h4>
        </div>
        <div class="modal-body">
          <input class="inp" id="passInp" type="password" inputmode="numeric" maxlength="16"
            placeholder="•••••••" autocomplete="off"
            style="text-align:center;font-size:1.4rem;letter-spacing:.35em;margin-bottom:16px">
          <button class="btn-a" id="goBtn" style="width:100%;justify-content:center;padding:15px;font-size:1rem">${t('enter')}</button>
          <div class="pass-hint" id="loginHint">${t('passcode_hint')}</div>
        </div>
      </div>
    </div>`;
    const inp = root.querySelector('#passInp');
    const hint = root.querySelector('#loginHint');
    inp.focus();
    const submit = async () => {
      const pass = inp.value.trim();
      if (!pass) return;
      try {
        const j = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ pass }) });
        localStorage.setItem('naz_admin', j.token);
        location.reload();
      } catch {
        hint.textContent = t('wrong_pass');
        hint.style.color = 'var(--red)';
        inp.value = '';
        inp.focus();
      }
    };
    root.querySelector('#goBtn').onclick = submit;
    inp.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  }

  // ================= SHELL =================
  function renderShell() {
    root.innerHTML = `
    <div class="adm2">
      <header class="adm2-top">
        <div class="logo">
          <svg viewBox="0 0 48 48" width="28" height="28"><defs><linearGradient id="lg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e50914"/><stop offset="1" stop-color="#8f040c"/></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#lg3)"/><path d="M19 14.5v19l15.5-9.5z" fill="#fff"/></svg>
          <span class="brand" style="font-size:1.1rem">Naz<small>Panel</small></span>
        </div>
        <nav class="adm2-tabs">
          <button data-tab="content" class="on">🎬 ${t('a_content')}</button>
          <button data-tab="ads">📢 ${t('a_ads')}</button>
          <button data-tab="app">📱 ${t('app_section')}</button>
          <button data-tab="cust">⚙️ ${t('cust_section')}</button>
        </nav>
        <div class="adm2-right">
          <button id="langBtn" class="adm2-mini">${t('lang_btn')}</button>
          <a href="/" target="_blank" class="adm2-mini">🌐</a>
          <button id="logoutBtn" class="adm2-mini" title="${t('a_logout')}">⏻</button>
        </div>
      </header>
      <main class="adm2-body" id="admBody"></main>
    </div>`;
    root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => showTab(b.dataset.tab));
    root.querySelector('#langBtn').onclick = () => { toggleLang(); location.reload(); };
    root.querySelector('#logoutBtn').onclick = async () => {
      await aapi('/api/admin/logout', { method: 'POST' }).catch(() => {});
      localStorage.removeItem('naz_admin');
      location.href = '/';
    };
  }
  function showTab(name) {
    root.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
    const m = document.getElementById('admBody');
    m.innerHTML = '<div class="spin"></div>';
    if (name === 'ads') renderAds(m);
    else if (name === 'app') renderApp(m);
    else if (name === 'cust') renderCust(m);
    else renderContent(m);
  }

  // ================= CUSTOMIZE TAB =================
  async function renderCust(m) {
    const s = await aapi('/api/admin/site');
    m.innerHTML = `
      <p style="color:var(--muted);font-size:.85rem;margin-bottom:18px">✔ ${t('cust_hint')}</p>
      <div class="panel" style="max-width:640px">
        <h3>🏷️ ${t('site_name')} · ${t('logo_f').split('(')[0]}</h3>
        <label class="f"><span>${t('site_name')}</span>
          <input class="inp" id="cName" value="${esc(s.site_name)}"></label>
        <label class="f"><span>${t('logo_f')}</span>
          <input class="inp" id="cLogo" dir="ltr" value="${esc(s.logo_url)}" placeholder="https://…/logo.png">
          <img id="cLogoPv" src="${esc(s.logo_url)}" alt="" style="height:38px;margin-top:10px;${s.logo_url ? '' : 'display:none'}" onerror="this.style.display='none'"></label>
        <label class="f"><span>${t('footer_text_f')}</span>
          <input class="inp" id="cFooter" value="${esc(s.footer_text)}" placeholder="${LANG === 'ar' ? 'مثال: أفضل موقع لمشاهدة وتحميل الأفلام' : 'e.g. Best place to watch movies'}"></label>
      </div>
      <div class="panel" style="max-width:640px">
        <h3>📄 ${t('terms')} · ${t('privacy')} <span style="float:inline-end;display:flex;gap:14px;font-size:.8rem;font-weight:600">
          <a href="/terms" target="_blank" style="color:#82aaff">${t('view_page')}</a>
          <a href="/privacy" target="_blank" style="color:#82aaff">${t('view_page')}</a></span></h3>
        <label class="f"><span>${t('page_terms_f')}</span>
          <textarea class="inp" id="cTerms" dir="rtl" rows="7" placeholder="<h3>…</h3><p>…</p>">${esc(s.page_terms)}</textarea></label>
        <label class="f"><span>${t('page_priv_f')}</span>
          <textarea class="inp" id="cPriv" dir="rtl" rows="7" placeholder="<h3>…</h3><p>…</p>">${esc(s.page_privacy)}</textarea></label>
      </div>
      <div class="panel" style="max-width:640px">
        <h3>🔍 SEO · Google <a href="/keywords" target="_blank" style="float:inline-end;font-size:.8rem;font-weight:600;color:#82aaff">${t('view_page')}</a></h3>
        <label class="f"><span>${t('seo_desc_f')}</span>
          <textarea class="inp" id="cSeoD" rows="2" maxlength="400">${esc(s.seo_description)}</textarea></label>
        <label class="f"><span>${t('seo_kw_f')}</span>
          <textarea class="inp" id="cSeoK" dir="rtl" rows="3" placeholder="مشاهدة أفلام, تحميل أفلام, مسلسلات مترجمة, أفلام عربية, aflam, movies online">${esc(s.seo_keywords)}</textarea></label>
      </div>
      <button class="btn-a" id="saveCust" style="width:100%;max-width:640px;justify-content:center;padding:15px;font-size:1rem">💾 ${t('save')}</button>`;
    m.querySelector('#cLogo').oninput = (e) => {
      const pv = m.querySelector('#cLogoPv');
      pv.style.display = e.target.value ? '' : 'none';
      pv.src = e.target.value;
    };
    m.querySelector('#saveCust').onclick = async () => {
      await aapi('/api/admin/site', { method: 'PUT', body: JSON.stringify({
        site_name: m.querySelector('#cName').value.trim(),
        logo_url: m.querySelector('#cLogo').value.trim(),
        footer_text: m.querySelector('#cFooter').value.trim(),
        page_terms: m.querySelector('#cTerms').value,
        page_privacy: m.querySelector('#cPriv').value,
        seo_description: m.querySelector('#cSeoD').value.trim(),
        seo_keywords: m.querySelector('#cSeoK').value.trim(),
      }) });
      window.NAZ_CFG = await api('/api/config');
      toast(t('saved'));
    };
  }

  // ================= APP TAB =================
  async function renderApp(m) {
    const a = await aapi('/api/admin/app');
    m.innerHTML = `
      <div class="panel" style="max-width:560px">
        <h3>📱 ${t('app_section')}</h3>
        <p style="color:var(--muted);font-size:.85rem;line-height:1.8;margin-bottom:16px">${t('app_hint')}</p>
        <div class="adrow">
          <label class="switch"><input type="checkbox" id="appOn" ${a.enabled ? 'checked' : ''}><span class="sl"></span></label>
          <span class="adrow-lbl">${a.enabled ? t('on') : t('off')}</span>
          <span style="color:var(--muted);font-size:.85rem">${t('app_show')}</span>
        </div>
        <label class="f"><span>${t('app_url')}</span>
          <input class="inp" id="appUrl" dir="ltr" value="${esc(a.url)}" placeholder="https://play.google.com/… أو رابط APK مباشر"></label>
        <label class="f"><span>${t('app_text')}</span>
          <input class="inp" id="appText" value="${esc(a.text)}" placeholder="${LANG === 'ar' ? 'حمّل التطبيق' : 'Get the App'}"></label>
        <button class="btn-a" id="saveApp" style="width:100%;justify-content:center;padding:14px">💾 ${t('save')}</button>
      </div>`;
    m.querySelector('#appOn').addEventListener('change', (e) => {
      m.querySelector('.adrow-lbl').textContent = e.target.checked ? t('on') : t('off');
    });
    m.querySelector('#saveApp').onclick = async () => {
      await aapi('/api/admin/app', { method: 'PUT', body: JSON.stringify({
        enabled: m.querySelector('#appOn').checked,
        url: m.querySelector('#appUrl').value.trim(),
        text: m.querySelector('#appText').value.trim(),
      }) });
      toast(t('saved'));
    };
  }

  // ================= CONTENT TAB =================
  async function renderContent(m) {
    const titles = (await aapi('/api/titles')).sort((a, b) => b.id - a.id);
    m.innerHTML = `
      <div class="toolbar">
        <button class="btn-a" id="addM">＋ ${t('add_movie').replace('＋ ','')}</button>
        <button class="btn-a" id="addS">＋ ${t('add_series').replace('＋ ','')}</button>
        <input class="inp grow" id="flt" placeholder="🔍 ${t('search')}…">
      </div>
      <p style="color:var(--muted);font-size:.82rem;margin-bottom:14px">✔ ${t('save_content_hint')}</p>
      <div id="list"></div>`;
    const list = m.querySelector('#list');
    const draw = (flt = '') => {
      const rows = titles.filter(x => !flt || (x.title + ' ' + (x.title_ar || '')).toLowerCase().includes(flt.toLowerCase()));
      list.innerHTML = rows.map(x => `
        <div class="c-row">
          <img src="${x.poster || ''}" onerror="this.style.visibility='hidden'" alt="">
          <div class="c-info">
            <b>${esc(LANG === 'ar' ? (x.title_ar || x.title) : x.title)}</b>
            <small>${esc(x.title)} · ${x.year || '—'}${x.country ? ' · ' + esc(x.country) : ''}</small>
          </div>
          <span class="tag ${x.type}">${x.type === 'movie' ? t('movie') : t('serie')}</span>
          <button class="btn-a inline" data-edit="${x.id}">✎ ${t('edit')}</button>
          <button class="btn-a danger" data-del="${x.id}">🗑</button>
        </div>`).join('') || `<div class="empty">${t('no_content')}</div>`;
    };
    draw();
    m.querySelector('#flt').oninput = (e) => draw(e.target.value);
    m.querySelector('#addM').onclick = () => openEditor({ type: 'movie' });
    m.querySelector('#addS').onclick = () => openEditor({ type: 'series' });
    list.onclick = async (e) => {
      const ed = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-del]');
      if (ed) openEditor(await aapi('/api/titles/' + ed.dataset.edit));
      if (del && confirm(t('confirm_del'))) {
        await aapi('/api/admin/titles/' + del.dataset.del, { method: 'DELETE' });
        toast(t('deleted'));
        renderContent(m);
      }
    };
  }

  // ================= EDITOR (movie or series) =================
  async function openEditor(x) {
    closeModal();
    const isNew = !x.id;
    const isMovie = x.type === 'movie';
    const bk = document.createElement('div');
    bk.className = 'modal-bk'; bk.id = 'modalBk';
    bk.innerHTML = `
      <div class="modal ed2">
        <div class="modal-h">
          <h4>${isNew ? (isMovie ? t('add_movie') : t('add_series')) : '✎ ' + esc(LANG === 'ar' ? (x.title_ar || x.title) : x.title)}</h4>
          <button class="close-x" data-close>${ICONS.close}</button>
        </div>
        <div class="modal-body" id="edBody"></div>
      </div>`;
    document.body.appendChild(bk);
    document.body.style.overflow = 'hidden';
    const body = bk.querySelector('#edBody');

    // ---- basic info block ----
    const gid = (x.genres || [])[0] || '';
    body.innerHTML = `
      <div class="sec-label" style="margin-top:0">📝 ${t('basic')}</div>
      <div class="form-grid">
        <label class="f"><span>${t('title_ar_f')}</span><input class="inp" id="fTitleAr" dir="rtl" value="${esc(x.title_ar || '')}"></label>
        <label class="f"><span>${t('title_f')}</span><input class="inp" id="fTitle" dir="ltr" value="${esc(x.title || '')}"></label>
        <label class="f"><span>${t('year_f')}</span><input class="inp" id="fYear" type="number" inputmode="numeric" value="${x.year || ''}"></label>
        <label class="f"><span>${t('genres_f')}</span>
          <select class="inp" id="fGenre">${GENRE_LIST.map(g => `<option value="${g}" ${g === gid ? 'selected' : ''}>${genreName(g)}</option>`).join('')}</select></label>
        <label class="f"><span>${t('country_f')}</span><input class="inp" id="fCountry" value="${esc(x.country || '')}"></label>
        <label class="f"><span>${t('rating_f')}</span><input class="inp" id="fRating" type="number" step="0.1" min="0" max="10" value="${x.rating || ''}"></label>
      </div>
      <label class="f"><span>${t('poster_f')}</span><input class="inp" id="fPoster" dir="ltr" placeholder="https://…" value="${esc(x.poster || '')}"></label>
      <label class="f"><span>${t('backdrop_f')} (${LANG === 'ar' ? 'اختياري' : 'optional'})</span><input class="inp" id="fBackdrop" dir="ltr" value="${esc(x.backdrop || '')}"></label>
      <label class="f"><span>${t('overview_ar_f')}</span><textarea class="inp" id="fOvAr" dir="rtl">${esc(x.overview_ar || '')}</textarea></label>
      <label class="f"><span>${t('overview_f')}</span><textarea class="inp" id="fOv" dir="ltr">${esc(x.overview || '')}</textarea></label>
      <label style="display:flex;align-items:center;gap:10px;margin:4px 0 16px;cursor:pointer">
        <input type="checkbox" id="fFeat" ${x.featured ? 'checked' : ''}> ${t('featured_f')}</label>
      <button class="btn-a" id="saveBasic" style="width:100%;justify-content:center">💾 ${t('save')}</button>
      <div id="afterSave"></div>`;
    document.body.style.overflow = 'hidden';

    body.querySelector('#saveBasic').onclick = async () => {
      const payload = {
        type: x.type,
        title_ar: body.querySelector('#fTitleAr').value.trim(),
        title: body.querySelector('#fTitle').value.trim() || body.querySelector('#fTitleAr').value.trim(),
        year: +body.querySelector('#fYear').value || null,
        genres: [+body.querySelector('#fGenre').value],
        country: body.querySelector('#fCountry').value.trim(),
        rating: +body.querySelector('#fRating').value || 0,
        poster: body.querySelector('#fPoster').value.trim(),
        backdrop: body.querySelector('#fBackdrop').value.trim(),
        overview_ar: body.querySelector('#fOvAr').value,
        overview: body.querySelector('#fOv').value,
        featured: body.querySelector('#fFeat').checked ? 1 : 0,
      };
      if (!payload.title) return toast(t('title_f') + ' ?', false);
      if (isNew) {
        const j = await aapi('/api/admin/titles', { method: 'POST', body: JSON.stringify(payload) });
        toast(t('saved'));
        closeModal();
        openEditor(await aapi('/api/titles/' + j.id));   // reopen with server sections
        return;
      }
      await aapi('/api/admin/titles/' + x.id, { method: 'PUT', body: JSON.stringify(payload) });
      toast(t('saved'));
    };

    // ---- server sections (existing titles only) ----
    if (isNew) return;
    const after = body.querySelector('#afterSave');
    if (isMovie) {
      after.innerHTML = `
        <div class="sec-label">🎬 ${t('watch_servers')} · ⭐ = ${t('primary')}</div>
        <div id="srvBox"></div>
        <div class="sec-label">⬇ ${t('dl_servers')}</div>
        <div id="dlBox"></div>`;
      renderServers(after.querySelector('#srvBox'), 'title', x.id, () => after.querySelector('#srvBox'), x.servers || []);
      renderDownloads(after.querySelector('#dlBox'), 'title', x.id, x.downloads || []);
    } else {
      after.innerHTML = `<div class="sec-label">📺 ${t('seasons_m')}</div><div id="seasonsBox"></div>`;
      renderSeasons(after.querySelector('#seasonsBox'), x.id);
    }
  }

  // ================= WATCH SERVERS manager (shared by movie & episode) =================
  async function refreshServers(box, parentType, parentId) {
    let servers = [];
    if (parentType === 'title') servers = (await aapi('/api/titles/' + parentId)).servers || [];
    else servers = await fetchEpServers(parentId);
    renderServers(box, parentType, parentId, () => box, servers, true);
  }
  async function fetchEpServers(epId) {
    const titles = await aapi('/api/titles?type=series');
    for (const tt of titles) {
      const full = await aapi('/api/titles/' + tt.id);
      for (const s of full.seasons) {
        const ep = s.episodes.find(e => e.id === epId);
        if (ep) return ep.servers || [];
      }
    }
    return [];
  }
  function renderServers(box, parentType, parentId, getBox, servers, isRefresh) {
    const move = async (i, dir) => {
      const ids = servers.map(s => s.id);
      const j = i + dir;
      if (j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      await aapi('/api/admin/servers/reorder', { method: 'POST', body: JSON.stringify({ parent_type: parentType, parent_id: parentId, ids }) });
      refreshServers(getBox(), parentType, parentId);
    };
    box.innerHTML = `
      ${servers.map((s, i) => `
      <div class="srv2" data-sid="${s.id}">
        <button class="star ${s.is_default ? 'on' : ''}" data-act="def" title="${t('primary')}">★</button>
        <div class="srv2-ord">
          <button data-act="up" ${i === 0 ? 'disabled' : ''}>▲</button>
          <button data-act="down" ${i === servers.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
        <div class="srv2-fields">
          <input class="inp" data-f="name" value="${esc(s.name)}" placeholder="${t('server_name')}">
          <input class="inp" data-f="url" dir="ltr" value="${esc(s.url)}" placeholder="${t('server_url')}">
          <select class="inp" data-f="kind">
            <option value="embed" ${s.kind === 'embed' ? 'selected' : ''}>iframe</option>
            <option value="mp4" ${s.kind === 'mp4' ? 'selected' : ''}>MP4</option>
          </select>
        </div>
        <button class="btn-a inline" data-act="save">💾</button>
        <button class="btn-a danger" data-act="del">🗑</button>
      </div>`).join('')}
      <div class="srv2 srv2-new">
        <span style="width:30px;text-align:center;color:var(--muted)">＋</span>
        <div class="srv2-fields">
          <input class="inp" id="nsName" value="Server ${servers.length + 1}" placeholder="${t('server_name')}">
          <input class="inp" id="nsUrl" dir="ltr" placeholder="${t('server_url')}">
          <select class="inp" id="nsKind"><option value="embed">iframe</option><option value="mp4">MP4</option></select>
        </div>
        <button class="btn-a" id="nsAdd" style="white-space:nowrap">＋ ${t('add_server')}</button>
      </div>`;
    box.querySelector('#nsAdd').onclick = async () => {
      const name = box.querySelector('#nsName').value.trim();
      const url = box.querySelector('#nsUrl').value.trim();
      if (!name || !url) return toast(t('err'), false);
      await aapi('/api/admin/servers', { method: 'POST', body: JSON.stringify({
        parent_type: parentType, parent_id: parentId, name, url,
        kind: box.querySelector('#nsKind').value, is_default: servers.length === 0 }) });
      toast(t('saved'));
      refreshServers(getBox(), parentType, parentId);
    };
    box.onclick = async (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const row = btn.closest('[data-sid]');
      if (!row) return;
      const id = +row.dataset.sid;
      const idx = servers.findIndex(s => s.id === id);
      const act = btn.dataset.act;
      if (act === 'del' && confirm(t('confirm_del'))) {
        await aapi('/api/admin/servers/' + id, { method: 'DELETE' });
        toast(t('deleted'));
        refreshServers(getBox(), parentType, parentId);
      } else if (act === 'save') {
        const g = (f) => row.querySelector(`[data-f="${f}"]`).value;
        await aapi('/api/admin/servers/' + id, { method: 'PUT', body: JSON.stringify({ name: g('name'), url: g('url'), kind: g('kind') }) });
        toast(t('saved'));
      } else if (act === 'def') {
        await aapi('/api/admin/servers/' + id, { method: 'PUT', body: JSON.stringify({ is_default: true }) });
        refreshServers(getBox(), parentType, parentId);
      } else if (act === 'up') move(idx, -1);
      else if (act === 'down') move(idx, 1);
    };
  }

  // ================= DOWNLOAD SERVERS manager =================
  function renderDownloads(box, parentType, parentId, links) {
    const refresh = async () => {
      if (parentType === 'title') renderDownloads(box, parentType, parentId, (await aapi('/api/titles/' + parentId)).downloads || []);
      else {
        const titles = await aapi('/api/titles?type=series');
        for (const tt of titles) {
          const full = await aapi('/api/titles/' + tt.id);
          for (const s of full.seasons) {
            const ep = s.episodes.find(e => e.id === parentId);
            if (ep) { renderDownloads(box, parentType, parentId, ep.downloads || []); return; }
          }
        }
      }
    };
    box.innerHTML = `
      ${links.map(l => `
      <div class="srv2" data-did="${l.id}">
        <div class="srv2-fields" style="grid-template-columns:90px 1fr 2fr">
          <input class="inp" data-f="quality" value="${esc(l.quality)}" placeholder="1080p">
          <input class="inp" data-f="size" value="${esc(l.size || '')}" placeholder="1.5 GB">
          <input class="inp" data-f="url" dir="ltr" value="${esc(l.url)}" placeholder="${t('link_url')}">
        </div>
        <button class="btn-a inline" data-act="save">💾</button>
        <button class="btn-a danger" data-act="del">🗑</button>
      </div>`).join('')}
      <div class="srv2 srv2-new">
        <div class="srv2-fields" style="grid-template-columns:90px 1fr 2fr">
          <input class="inp" id="ndQ" placeholder="720p">
          <input class="inp" id="ndS" placeholder="1 GB">
          <input class="inp" id="ndU" dir="ltr" placeholder="${t('link_url')}">
        </div>
        <button class="btn-a" id="ndAdd" style="white-space:nowrap">＋ ${t('add_link')}</button>
      </div>`;
    box.querySelector('#ndAdd').onclick = async () => {
      const quality = box.querySelector('#ndQ').value.trim();
      const url = box.querySelector('#ndU').value.trim();
      if (!quality || !url) return toast(t('err'), false);
      await aapi('/api/admin/downloads', { method: 'POST', body: JSON.stringify({
        parent_type: parentType, parent_id: parentId, quality, size: box.querySelector('#ndS').value.trim(), url }) });
      toast(t('saved'));
      refresh();
    };
    box.onclick = async (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const row = btn.closest('[data-did]');
      if (!row) return;
      const id = +row.dataset.did;
      if (btn.dataset.act === 'del' && confirm(t('confirm_del'))) {
        await aapi('/api/admin/downloads/' + id, { method: 'DELETE' });
        toast(t('deleted'));
        refresh();
      } else {
        const g = (f) => row.querySelector(`[data-f="${f}"]`).value;
        await aapi('/api/admin/downloads/' + id, { method: 'PUT', body: JSON.stringify({ quality: g('quality'), size: g('size'), url: g('url') }) });
        toast(t('saved'));
      }
    };
  }

  // ================= SEASONS & EPISODES =================
  async function renderSeasons(box, titleId) {
    const full = await aapi('/api/titles/' + titleId);
    box.innerHTML = `
      ${full.seasons.map(s => `
      <div class="season2">
        <div class="season2-h">
          <b>${t('season')} ${s.number}</b>
          <small>${s.episodes.length} ${t('episodes')}</small>
          <span style="flex:1"></span>
          <button class="btn-a inline" data-addep="${s.id}" data-n="${(s.episodes[s.episodes.length - 1]?.number || 0) + 1}">＋ ${t('add_ep')}</button>
          <button class="btn-a danger" data-dels="${s.id}">🗑</button>
        </div>
        ${s.episodes.map(e => `
          <div class="ep2">
            <span class="q-badge" style="background:#2a2a35">${t('ep')}${e.number}</span>
            <span class="ep2-n">${esc(e.name || '')}</span>
            <button class="btn-a inline" data-edep="${e.id}">✎</button>
            <button class="btn-a danger" data-delep="${e.id}">🗑</button>
          </div>`).join('')}
      </div>`).join('')}
      <button class="btn-a gray" id="addSeason2" style="width:100%;justify-content:center;margin-top:14px">＋ ${t('add_season')}</button>`;
    box.querySelector('#addSeason2').onclick = async () => {
      const n = full.seasons.length ? Math.max(...full.seasons.map(s => s.number)) + 1 : 1;
      await aapi(`/api/admin/titles/${titleId}/seasons`, { method: 'POST', body: JSON.stringify({ number: n, name: 'Season ' + n }) });
      renderSeasons(box, titleId);
    };
    box.onclick = async (e) => {
      const add = e.target.closest('[data-addep]');
      const ed = e.target.closest('[data-edep]');
      const dele = e.target.closest('[data-delep]');
      const dels = e.target.closest('[data-dels]');
      if (add) {
        await aapi(`/api/admin/seasons/${add.dataset.addep}/episodes`, { method: 'POST', body: JSON.stringify({ number: +add.dataset.n, name: 'Episode ' + add.dataset.n }) });
        renderSeasons(box, titleId);
      } else if (ed) openEpisodeEditor(+ed.dataset.edep, () => renderSeasons(box, titleId));
      else if (dele && confirm(t('confirm_del'))) { await aapi('/api/admin/episodes/' + dele.dataset.delep, { method: 'DELETE' }); renderSeasons(box, titleId); }
      else if (dels && confirm(t('confirm_del'))) { await aapi('/api/admin/seasons/' + dels.dataset.dels, { method: 'DELETE' }); renderSeasons(box, titleId); }
    };
  }

  async function openEpisodeEditor(epId, onClose) {
    const bk2 = document.createElement('div');
    bk2.className = 'modal-bk'; bk2.style.zIndex = 120;
    bk2.innerHTML = `
      <div class="modal ed2">
        <div class="modal-h"><h4>✎ ${t('edit_ep')}</h4>
          <button class="close-x" id="epClose">${ICONS.close}</button></div>
        <div class="modal-body"><div class="spin"></div></div>
      </div>`;
    document.body.appendChild(bk2);
    const body = bk2.querySelector('.modal-body');
    const close = () => { bk2.remove(); onClose && onClose(); };
    bk2.querySelector('#epClose').onclick = close;
    bk2.onclick = (e) => { if (e.target === bk2) close(); };

    let ep = null;
    const titles = await aapi('/api/titles?type=series');
    for (const tt of titles) {
      const full = await aapi('/api/titles/' + tt.id);
      for (const s of full.seasons) {
        const f = s.episodes.find(e => e.id === epId);
        if (f) { ep = f; break; }
      }
      if (ep) break;
    }
    if (!ep) { body.innerHTML = '—'; return; }
    body.innerHTML = `
      <div class="form-grid">
        <label class="f"><span>#</span><input class="inp" id="epNum" type="number" value="${ep.number}"></label>
        <label class="f"><span>${t('runtime_f')}</span><input class="inp" id="epRt" type="number" value="${ep.runtime || ''}"></label>
        <label class="f"><span>${t('title_ar_f')}</span><input class="inp" id="epNameAr" dir="rtl" value="${esc(ep.name_ar || '')}"></label>
        <label class="f"><span>${t('title_f')}</span><input class="inp" id="epName" dir="ltr" value="${esc(ep.name || '')}"></label>
      </div>
      <label class="f"><span>${t('overview_f')}</span><textarea class="inp" id="epOv" dir="rtl">${esc(ep.overview || '')}</textarea></label>
      <button class="btn-a" id="epSave" style="width:100%;justify-content:center">💾 ${t('save')}</button>
      <div class="sec-label">🎬 ${t('watch_servers')} · ⭐ = ${t('primary')}</div>
      <div id="epSrv"></div>
      <div class="sec-label">⬇ ${t('dl_servers')}</div>
      <div id="epDl"></div>`;
    body.querySelector('#epSave').onclick = async () => {
      await aapi('/api/admin/episodes/' + epId, { method: 'PUT', body: JSON.stringify({
        number: +body.querySelector('#epNum').value || ep.number,
        runtime: +body.querySelector('#epRt').value || null,
        name: body.querySelector('#epName').value,
        name_ar: body.querySelector('#epNameAr').value,
        overview: body.querySelector('#epOv').value,
      }) });
      toast(t('saved'));
    };
    renderServers(body.querySelector('#epSrv'), 'episode', epId, () => body.querySelector('#epSrv'), ep.servers || []);
    renderDownloads(body.querySelector('#epDl'), 'episode', epId, ep.downloads || []);
  }

  // ================= ADS TAB =================
  async function renderAds(m) {
    const cfg = await aapi('/api/admin/ads');
    m.innerHTML = `
      <div class="panel ads2p">
        <h3>🖼️ ${t('ad_banners')}</h3>
        <div id="bannerList"></div>
        <button class="btn-a gray" id="addBanner">${t('add_banner')}</button>
      </div>
      <div class="panel ads2p">
        <h3>💥 ${t('ad_pop')}</h3>
        <div class="adrow">
          <label class="switch"><input type="checkbox" id="popOn" ${cfg.popunder.enabled ? 'checked' : ''}><span class="sl"></span></label>
          <span class="adrow-lbl">${cfg.popunder.enabled ? t('on') : t('off')}</span>
          <span style="flex:1"></span>
          <label style="display:flex;align-items:center;gap:8px;color:var(--muted);font-size:.85rem">
            ${t('pop_freq')}
            <input class="inp" id="popFreq" type="number" min="1" max="168" value="${cfg.popunder.freq_hours}" style="width:90px">
          </label>
        </div>
        <textarea class="inp" id="popCode" dir="ltr" rows="5" spellcheck="false" placeholder="&lt;script&gt; … popunder / popads / adsterra … &lt;/script&gt;">${esc(cfg.popunder.code)}</textarea>
      </div>
      <div class="panel ads2p">
        <h3>🎬 ${t('ad_player')}</h3>
        <div class="adrow">
          <label class="switch"><input type="checkbox" id="plOn" ${cfg.player.enabled ? 'checked' : ''}><span class="sl"></span></label>
          <span class="adrow-lbl">${cfg.player.enabled ? t('on') : t('off')}</span>
          <span style="flex:1"></span>
          <select class="inp" id="plMode" style="width:170px">
            <option value="text" ${cfg.player.mode === 'text' ? 'selected' : ''}>${t('mode_text')}</option>
            <option value="code" ${cfg.player.mode === 'code' ? 'selected' : ''}>${t('mode_code')}</option>
          </select>
          <select class="inp" id="plPos" style="width:160px">
            <option value="below" ${cfg.player.position === 'below' ? 'selected' : ''}>${t('pos_below')}</option>
            <option value="above" ${cfg.player.position === 'above' ? 'selected' : ''}>${t('pos_above')}</option>
          </select>
        </div>
        <input class="inp" id="plText" value="${cfg.player.mode === 'text' ? esc(cfg.player.content) : ''}" placeholder="${t('ad_text')}" style="margin-bottom:10px;${cfg.player.mode === 'code' ? 'display:none' : ''}">
        <input class="inp" id="plLink" dir="ltr" value="${esc(cfg.player.link)}" placeholder="${t('ad_link')}" style="margin-bottom:10px;${cfg.player.mode === 'code' ? 'display:none' : ''}">
        <textarea class="inp" id="plCode" dir="ltr" rows="5" spellcheck="false" placeholder="&lt;div&gt;…&lt;/div&gt;" style="${cfg.player.mode === 'text' ? 'display:none' : ''}">${cfg.player.mode === 'code' ? esc(cfg.player.content) : ''}</textarea>
      </div>
      <button class="btn-a" id="saveAds" style="width:100%;justify-content:center;font-size:1rem;padding:15px">💾 ${t('save_ads')}</button>`;

    // banners
    const bl = m.querySelector('#bannerList');
    const drawBanners = () => {
      bl.innerHTML = cfg.banners.map((b, i) => `
        <div class="ad-block" data-i="${i}">
          <div class="adrow">
            <label class="switch"><input type="checkbox" data-f="enabled" ${b.enabled ? 'checked' : ''}><span class="sl"></span></label>
            <select class="inp" data-f="position" style="width:170px">
              <option value="top" ${b.position === 'top' ? 'selected' : ''}>${t('pos_top')}</option>
              <option value="bottom" ${b.position === 'bottom' ? 'selected' : ''}>${t('pos_bottom')}</option>
            </select>
            <span style="flex:1"></span>
            <button class="btn-a danger" data-rm="${i}">🗑</button>
          </div>
          <textarea class="inp" data-f="code" dir="ltr" rows="4" spellcheck="false" placeholder="&lt;script&gt; … banner code … &lt;/script&gt;">${esc(b.code)}</textarea>
        </div>`).join('') || `<div class="empty" style="padding:20px">—</div>`;
    };
    drawBanners();
    m.querySelector('#addBanner').onclick = () => { collectBanners(); cfg.banners.push({ id: Date.now(), enabled: true, position: 'top', code: '' }); drawBanners(); };
    bl.onclick = (e) => {
      const rm = e.target.closest('[data-rm]');
      if (rm) { collectBanners(); cfg.banners.splice(+rm.dataset.rm, 1); drawBanners(); }
    };
    const collectBanners = () => {
      bl.querySelectorAll('.ad-block').forEach(b => {
        cfg.banners[+b.dataset.i] = {
          id: cfg.banners[+b.dataset.i]?.id || +b.dataset.i + 1,
          enabled: b.querySelector('[data-f="enabled"]').checked,
          position: b.querySelector('[data-f="position"]').value,
          code: b.querySelector('[data-f="code"]').value,
        };
      });
    };
    // player mode toggle
    m.querySelector('#plMode').onchange = (e) => {
      const code = e.target.value === 'code';
      m.querySelector('#plText').style.display = code ? 'none' : '';
      m.querySelector('#plLink').style.display = code ? 'none' : '';
      m.querySelector('#plCode').style.display = code ? '' : 'none';
    };
    // save all
    m.querySelector('#saveAds').onclick = async () => {
      collectBanners();
      const mode = m.querySelector('#plMode').value;
      await aapi('/api/admin/ads', { method: 'PUT', body: JSON.stringify({
        banners: cfg.banners,
        popunder: {
          enabled: m.querySelector('#popOn').checked,
          code: m.querySelector('#popCode').value,
          freq_hours: +m.querySelector('#popFreq').value || 24,
        },
        player: {
          enabled: m.querySelector('#plOn').checked,
          mode,
          content: mode === 'code' ? m.querySelector('#plCode').value : m.querySelector('#plText').value,
          link: m.querySelector('#plLink').value.trim(),
          position: m.querySelector('#plPos').value,
        },
      }) });
      toast(t('saved'));
    };
    // live label for switches
    m.querySelectorAll('.switch input').forEach(sw => sw.addEventListener('change', () => {
      const lbl = sw.closest('.adrow')?.querySelector('.adrow-lbl');
      if (lbl) lbl.textContent = sw.checked ? t('on') : t('off');
    }));
  }
})();
