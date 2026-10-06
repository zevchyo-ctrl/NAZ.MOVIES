// NazMovies — title details page
(async function () {
  await initLang();
  document.getElementById('yr').textContent = new Date().getFullYear();
  buildHeader('home');
  translateStatic();

  const id = +new URLSearchParams(location.search).get('id');
  if (!id) return location.href = '/';
  const app = document.getElementById('app');
  let x;
  try { x = await api('/api/titles/' + id); }
  catch { location.href = '/'; return; }

  const name = LANG === 'ar' ? (x.title_ar || x.title) : x.title;
  const ov = LANG === 'ar' ? (x.overview_ar || x.overview) : x.overview;
  document.title = name + ' — ' + ((window.NAZ_CFG && window.NAZ_CFG.site_name) || 'NazMovies');

  initTracking();
  injectAds();

  if (x.type === 'movie') renderMovie(); else renderSeries();

  function heroHTML(actions) {
    return `
    <section class="detail-hero">
      <div class="hero-bg"><img src="${x.backdrop || x.poster || PLACEHOLDER_POSTER(name)}"
        onerror="this.onerror=null;this.src='${PLACEHOLDER_POSTER(name)}'" alt=""></div>
      <div class="hero-shade"></div>
      <div class="detail-wrap">
        <img class="detail-poster" src="${x.poster || PLACEHOLDER_POSTER(name)}"
          onerror="this.onerror=null;this.src='${PLACEHOLDER_POSTER(name)}'" alt="">
        <div class="detail-info">
          <div class="hero-badge">${x.type === 'movie' ? t('movie') : t('serie')}</div>
          <h1 class="hero-title" style="font-size:clamp(1.9rem,4.5vw,3.4rem)">${name}</h1>
          <div class="hero-meta">
            <span class="rate">★ ${x.rating || '—'}</span>
            <span>${x.year || ''}</span>
            ${x.runtime ? `<span>${x.runtime} ${t('min')}</span>` : ''}
          </div>
          <div class="chips">${x.genres.map(g => `<span class="chip">${genreName(g)}</span>`).join('')}${x.country ? `<span class="chip">🌐 ${x.country}</span>` : ''}</div>
          <div class="stats-line">
            <span>${ICONS.play.replace('<svg', '<svg style="width:15px;height:15px;vertical-align:-2px"')} <b>${fmtNum(x.views)}</b> ${t('views')}</span>
            <span>${ICONS.dl.replace('<svg', '<svg style="width:15px;height:15px;vertical-align:-2px"')} <b>${fmtNum(x.downloads)}</b> ${t('dl_count')}</span>
          </div>
          ${actions}
        </div>
      </div>
    </section>`;
  }

  function renderMovie() {
    const actions = `
      <div class="hero-actions">
        <button class="btn btn-play" id="mPlay">${ICONS.play}<span>${t('watch_now')}</span></button>
        <button class="btn btn-dl" id="mDl">${ICONS.dl}<span>${t('download')}</span></button>
      </div>`;
    app.innerHTML = heroHTML(actions) + `
      <section class="content-sec">
        <h3>${t('about')}</h3>
        <p style="max-width:820px;line-height:1.9;color:#d5d5dd">${ov || ''}</p>
      </section>
      <section class="content-sec">
        <h3>${t('servers')}</h3>
        <div class="server-tabs" style="padding:0;border:none">
          ${(x.servers || []).map((s, i) => `<button data-i="${i}">${s.name}</button>`).join('') || `<span class="empty">${t('no_links')}</span>`}
        </div>
        <div id="inlinePlayer" style="margin-top:16px"></div>
      </section>
      <section class="content-sec">
        <h3>${t('downloads_hd')}</h3>
        <div style="max-width:640px">
          ${(x.downloads || []).map(l => `
            <div class="dl-row">
              <span class="q-badge">${l.quality}</span>
              <span class="size">${l.size || ''}</span>
              <a class="dl-go" href="${l.url}" target="_blank" rel="noopener" download data-q="${l.quality}">${t('download')}</a>
            </div>`).join('') || `<span class="empty">${t('no_links')}</span>`}
        </div>
      </section>`;

    const playerBox = document.getElementById('inlinePlayer');
    let adMounted = false;
    const loadSrv = (i) => {
      const s = x.servers[i];
      $$('.server-tabs button', app).forEach((b, bi) => b.classList.toggle('on', bi === i));
      playerBox.innerHTML = s.kind === 'mp4'
        ? `<video class="player-frame" controls playsinline src="${s.url}"></video>`
        : `<iframe class="player-frame" src="${s.url}" allowfullscreen frameborder="0" referrerpolicy="no-referrer"></iframe>`;
      if (!adMounted) { adMounted = true; renderPlayerAd(playerBox); }
      playerBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    $$('.server-tabs button', app).forEach(b => b.onclick = () => {
      if (!b.dataset.counted) {
        b.dataset.counted = 1;
        api('/api/track/event', { method: 'POST', body: JSON.stringify({ kind: 'view', title_id: x.id }) }).catch(() => {});
      }
      loadSrv(+b.dataset.i);
    });
    document.getElementById('mPlay').onclick = () => openPlayer({ title: name, servers: x.servers, titleId: x.id });
    document.getElementById('mDl').onclick = () => openDownloads({ title: name, links: x.downloads, titleId: x.id });
    $$('.dl-go', app).forEach(a => a.addEventListener('click', () => {
      api('/api/track/event', { method: 'POST', body: JSON.stringify({ kind: 'download', title_id: x.id, quality: a.dataset.q }) }).catch(() => {});
    }));
  }

  function renderSeries() {
    const s0 = x.seasons[0];
    const totalEps = x.seasons.reduce((a, s) => a + s.episodes.length, 0);
    const actions = `
      <div class="hero-actions">
        <button class="btn btn-play" id="sPlay">${ICONS.play}<span>${t('watch_now')}</span></button>
        <button class="btn btn-dl" id="sDl">${ICONS.dl}<span>${t('download')}</span></button>
        <span class="chip" style="align-self:center">${x.seasons.length} ${t('seasons')} · ${totalEps} ${t('episodes')}</span>
      </div>`;
    app.innerHTML = heroHTML(actions) + `
      <section class="content-sec">
        <h3>${t('about')}</h3>
        <p style="max-width:820px;line-height:1.9;color:#d5d5dd">${ov || ''}</p>
      </section>
      <section class="content-sec">
        <h3>${t('episodes')}</h3>
        <div class="season-tabs" id="seasonTabs">
          ${x.seasons.map((s, i) => `<button data-i="${i}" class="${i === 0 ? 'on' : ''}">${t('season')} ${s.number}</button>`).join('')}
        </div>
        <div class="ep-grid" id="epGrid"></div>
      </section>`;

    const grid = document.getElementById('epGrid');
    function epsOf(si) {
      const s = x.seasons[si];
      $$('#seasonTabs button').forEach((b, bi) => b.classList.toggle('on', bi === si));
      grid.innerHTML = s.episodes.map(e => {
        const en = LANG === 'ar' ? (e.name_ar || e.name) : e.name;
        return `
        <div class="ep-card">
          <img src="${e.still || x.poster || PLACEHOLDER_POSTER(en)}" onerror="this.onerror=null;this.src='${PLACEHOLDER_POSTER(en)}'" alt="">
          <div class="info">
            <b>${t('ep')}${e.number} — ${en || ''}</b>
            <p>${e.overview || ''}</p>
            <small style="color:var(--muted)">▶ ${fmtNum(e.views)} · ⬇ ${fmtNum(e.downloads)}${e.runtime ? ' · ' + e.runtime + ' ' + t('min') : ''}</small>
          </div>
          <div class="acts">
            <button class="tiny-btn w" data-ep="${e.id}" data-act="play">${ICONS.play} ${t('watch_now')}</button>
            <button class="tiny-btn d" data-ep="${e.id}" data-act="dl">${ICONS.dl} ${t('download')}</button>
          </div>
        </div>`;
      }).join('') || `<div class="empty">${t('no_results')}</div>`;
    }
    document.getElementById('seasonTabs').onclick = (e) => {
      const i = e.target.closest('button')?.dataset.i;
      if (i !== undefined) epsOf(+i);
    };
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const epId = +btn.dataset.ep;
      const all = x.seasons.flatMap(s => s.episodes.map(ep => ({ ...ep, sn: s.number })));
      const ep = all.find(p => p.id === epId);
      const en = LANG === 'ar' ? (ep.name_ar || ep.name) : ep.name;
      const sub = `${t('season')} ${ep.sn} · ${t('ep')}${ep.number}`;
      if (btn.dataset.act === 'play') openPlayer({ title: name, subtitle: sub, servers: ep.servers, titleId: x.id, episodeId: epId });
      else openDownloads({ title: name, subtitle: `${sub} — ${en || ''}`, links: ep.downloads, titleId: x.id, episodeId: epId });
    });
    epsOf(0);
    const first = s0?.episodes[0];
    document.getElementById('sPlay').onclick = () => {
      if (first) openPlayer({ title: name, subtitle: `${t('season')} 1 · ${t('ep')}${first.number}`, servers: first.servers, titleId: x.id, episodeId: first.id });
    };
    document.getElementById('sDl').onclick = () => {
      if (first) openDownloads({ title: name, subtitle: `${t('season')} 1 · ${t('ep')}${first.number}`, links: first.downloads, titleId: x.id, episodeId: first.id });
    };
  }
})();
