// NazMovies — server (Express + SQLite)
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { db, getSetting, setSetting } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_TTL = 30 * 24 * 3600 * 1000; // 30 days (long-lived "session fix")
const TMDB_IMG = 'https://image.tmdb.org/t/p/';

app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// ---- SEO meta injection for the main public pages ----
const escAttr = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function seoMetaTags() {
  const site = getSetting('site_name', 'NazMovies');
  const desc = getSetting('seo_description', 'NazMovies — watch and download movies and series in HD.');
  const kw = getSetting('seo_keywords', '');
  return `<meta name="description" content="${escAttr(desc)}">\n<meta name="keywords" content="${escAttr(kw)}">\n<meta name="robots" content="index, follow">\n<meta property="og:title" content="${escAttr(site)}">\n<meta property="og:description" content="${escAttr(desc)}">\n<meta property="og:type" content="website">\n`;
}
app.get(['/', '/index.html', '/title.html'], (req, res) => {
  const file = path.join(__dirname, 'public', req.path === '/' ? 'index.html' : req.path);
  try {
    const html = fs.readFileSync(file, 'utf8').replace('</head>', seoMetaTags() + '</head>');
    res.type('html').send(html);
  } catch { res.status(404).end(); }
});

// ---- legal / SEO pages ----
function renderStaticPage(title, contentHtml) {
  const tpl = fs.readFileSync(path.join(__dirname, 'views', 'page.html'), 'utf8');
  return tpl
    .replaceAll('{{TITLE}}', escAttr(title))
    .replaceAll('{{SITE}}', escAttr(getSetting('site_name', 'NazMovies')))
    .replace('{{LOGO}}', getSetting('logo_url', ''))
    .replaceAll('{{CONTENT}}', contentHtml)
    .replace('{{YEAR}}', String(new Date().getFullYear()));
}
app.get('/terms', (req, res) => {
  const c = getSetting('page_terms', '') ||
    '<h3>شروط الاستخدام</h3><p>باستخدامك لهذا الموقع فأنت توافق على شروط الاستخدام هذه. المحتوى المعروض مملوك لأصحابه أو مرخّص للموقع، ولا يجوز إعادة نشره دون إذن.</p>';
  res.type('html').send(renderStaticPage('الشروط والأحكام', c));
});
app.get('/privacy', (req, res) => {
  const c = getSetting('page_privacy', '') ||
    '<h3>سياسة الخصوصية</h3><p>نحترم خصوصيتك. لا نقوم بجمع بيانات شخصية حساسة، وتُستخدم إحصائيات الزيارات لتحسين الخدمة فقط.</p>';
  res.type('html').send(renderStaticPage('سياسة الخصوصية', c));
});
app.get('/keywords', (req, res) => {
  const kw = getSetting('seo_keywords', '').split(',').map(s => s.trim()).filter(Boolean);
  const escH = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const titles = db.prepare('SELECT id,title,title_ar,type,year FROM titles ORDER BY views DESC LIMIT 100').all();
  const chips = kw.map(k => `<span class="kw-chip">${escH(k)}</span>`).join(' ') || '<p>—</p>';
  const list = titles.map(t =>
    `<li><a href="/title.html?id=${t.id}">${escH(t.title_ar || t.title)}${t.title_ar && t.title_ar !== t.title ? ' — ' + escH(t.title) : ''}</a> <small>(${t.type === 'movie' ? 'فيلم' : 'مسلسل'}${t.year ? ' · ' + t.year : ''})</small></li>`).join('');
  const content = `
    <p>${escH(getSetting('seo_description', ''))}</p>
    <h3>الكلمات المفتاحية</h3><div class="kw-chips">${chips}</div>
    <h3>محتوى الموقع</h3><ul class="kw-list">${list || '<li>—</li>'}</ul>`;
  res.type('html').send(renderStaticPage('الكلمات المفتاحية — تسويق ومحركات البحث', content));
});

app.use(express.static(path.join(__dirname, 'public')));

function sqlq(v){ return '\'' + String(v).replace(/'/g, '\'\'') + '\''; }
const today = () => new Date().toISOString().slice(0, 10);
const dayOffset = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

// ---------- helpers ----------
function cookieToken(req) {
  const c = req.headers.cookie || '';
  const m = c.match(/(?:^|;\s*)naz_admin=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : (req.headers['x-admin-token'] || null);
}
function requireAdmin(req, res, next) {
  const token = cookieToken(req);
  if (!token) return res.status(401).json({ error: 'auth' });
  const s = db.prepare('SELECT token, expires FROM sessions WHERE token=?').get(token);
  if (!s || s.expires < Date.now()) {
    if (s) db.prepare('DELETE FROM sessions WHERE token=?').run(token);
    return res.status(401).json({ error: 'auth' });
  }
  // sliding renewal — admin never gets kicked mid-browse
  db.prepare('UPDATE sessions SET expires=? WHERE token=?').run(Date.now() + SESSION_TTL, token);
  next();
}
function leanTitle(t) {
  return {
    id: t.id, type: t.type, title: t.title, title_ar: t.title_ar,
    poster: t.poster, backdrop: t.backdrop, year: t.year, rating: t.rating,
    runtime: t.runtime, country: t.country, genres: JSON.parse(t.genres || '[]'), views: t.views, downloads: t.downloads,
  };
}
function clientIp(req) {
  const xff = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.socket.remoteAddress || '';
}
function isPrivateIp(ip) {
  return !ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('10.') ||
    ip.startsWith('192.168.') || ip.startsWith('::ffff:127.') || ip.startsWith('172.');
}
async function geoLookup(ip) {
  if (isPrivateIp(ip)) return 'Local/Private';
  const cached = db.prepare('SELECT country FROM geo_cache WHERE ip=?').get(ip);
  if (cached) return cached.country;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    const r = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country`, { signal: ctrl.signal });
    clearTimeout(t);
    const j = await r.json();
    const country = j.status === 'success' ? j.country : 'Unknown';
    db.prepare('INSERT INTO geo_cache(ip,country,ts) VALUES (?,?,?) ON CONFLICT(ip) DO UPDATE SET country=excluded.country, ts=excluded.ts')
      .run(ip, country, Date.now());
    return country;
  } catch {
    return 'Unknown';
  }
}

// ---------- public API ----------
app.get('/api/config', (req, res) => {
  res.json({
    site_name: getSetting('site_name', 'NazMovies'),
    default_lang: getSetting('default_lang', 'ar'),
    logo_url: getSetting('logo_url', ''),
    footer_text: getSetting('footer_text', ''),
    app: {
      enabled: getSetting('app_enabled', '0') === '1',
      url: getSetting('app_url', ''),
      text: getSetting('app_text', ''),
    },
  });
});

// ---------- admin: site customization ----------
app.get('/api/admin/site', requireAdmin, (req, res) => {
  res.json({
    site_name: getSetting('site_name', 'NazMovies'),
    logo_url: getSetting('logo_url', ''),
    footer_text: getSetting('footer_text', ''),
    page_terms: getSetting('page_terms', ''),
    page_privacy: getSetting('page_privacy', ''),
    seo_description: getSetting('seo_description', ''),
    seo_keywords: getSetting('seo_keywords', ''),
  });
});
app.put('/api/admin/site', requireAdmin, (req, res) => {
  const b = req.body || {};
  const lim = (v, n) => String(v ?? '').slice(0, n);
  if (b.site_name !== undefined) setSetting('site_name', lim(b.site_name).slice(0, 60) || 'NazMovies');
  if (b.logo_url !== undefined) setSetting('logo_url', lim(b.logo_url, 1000));
  if (b.footer_text !== undefined) setSetting('footer_text', lim(b.footer_text, 300));
  if (b.page_terms !== undefined) setSetting('page_terms', lim(b.page_terms, 40000));
  if (b.page_privacy !== undefined) setSetting('page_privacy', lim(b.page_privacy, 40000));
  if (b.seo_description !== undefined) setSetting('seo_description', lim(b.seo_description, 400));
  if (b.seo_keywords !== undefined) setSetting('seo_keywords', lim(b.seo_keywords, 2000));
  res.json({ ok: true });
});

// ---- hidden admin panel: only reachable via the secret path ----
app.get('/adminjo', (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.sendFile(path.join(__dirname, 'views', 'adminjo.html'));
});

const ADS_DEFAULT = {
  banners: [],                                                     // [{id, enabled, position:'top'|'bottom', code}]
  popunder: { enabled: false, code: '', freq_hours: 24 },          // once per user per freq_hours
  player: { enabled: false, mode: 'text', content: '', link: '', position: 'below' }, // above|below player
};
function readAds() {
  try {
    const v = JSON.parse(getSetting('ads', ''));
    if (Array.isArray(v)) return { ...ADS_DEFAULT };               // legacy format → reset to new structure
    return { ...ADS_DEFAULT, ...v, popunder: { ...ADS_DEFAULT.popunder, ...(v.popunder || {}) }, player: { ...ADS_DEFAULT.player, ...(v.player || {}) } };
  } catch { return { ...ADS_DEFAULT }; }
}
app.get('/api/ads', (req, res) => {
  const a = readAds();
  res.json({
    banners: (a.banners || []).filter(b => b.enabled && (b.code || '').trim()),
    popunder: a.popunder,
    player: a.player,
  });
});

app.get('/api/home', (req, res) => {
  const all = db.prepare('SELECT * FROM titles ORDER BY created_at DESC').all();
  const byGenre = (gid) => all.filter(t => JSON.parse(t.genres || '[]').includes(gid)).map(leanTitle);
  res.json({
    featured: all.filter(t => t.featured).map(t => ({ ...leanTitle(t), overview: t.overview, overview_ar: t.overview_ar })),
    rows: [
      { key: 'trending', items: [...all].sort((a, b) => b.views - a.views).slice(0, 14).map(leanTitle) },
      { key: 'latest', items: all.slice(0, 14).map(leanTitle) },
      { key: 'movies', items: all.filter(t => t.type === 'movie').map(leanTitle) },
      { key: 'series', items: all.filter(t => t.type === 'series').map(leanTitle) },
      { key: 'action', gid: 28, items: byGenre(28) },
      { key: 'scifi', gid: 878, items: byGenre(878) },
      { key: 'crime', gid: 80, items: byGenre(80) },
      { key: 'horror', gid: 27, items: byGenre(27) },
    ].filter(r => r.items.length > 0),
  });
});

app.get('/api/titles', (req, res) => {
  const { type, q, genre } = req.query;
  let rows = db.prepare('SELECT * FROM titles ORDER BY views DESC').all();
  if (type === 'movie' || type === 'series') rows = rows.filter(t => t.type === type);
  if (genre) rows = rows.filter(t => JSON.parse(t.genres || '[]').includes(+genre));
  if (q) {
    const s = q.toLowerCase();
    rows = rows.filter(t => (t.title + ' ' + (t.title_ar || '')).toLowerCase().includes(s));
  }
  res.json(rows.map(leanTitle));
});

app.get('/api/titles/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM titles WHERE id=?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'not_found' });
  const out = { ...leanTitle(t), overview: t.overview, overview_ar: t.overview_ar, featured: t.featured };
  if (t.type === 'movie') {
    out.servers = db.prepare("SELECT id,name,url,kind,sort,is_default FROM servers WHERE parent_type='title' AND parent_id=? ORDER BY is_default DESC, sort, id").all(t.id);
    out.downloads = db.prepare("SELECT id,quality,size,url FROM download_links WHERE parent_type='title' AND parent_id=? ORDER BY id").all(t.id);
  } else {
    out.seasons = db.prepare('SELECT * FROM seasons WHERE title_id=? ORDER BY number').all(t.id).map(s => ({
      id: s.id, number: s.number, name: s.name,
      episodes: db.prepare('SELECT * FROM episodes WHERE season_id=? ORDER BY number').all(s.id).map(e => ({
        id: e.id, number: e.number, name: e.name, name_ar: e.name_ar, overview: e.overview,
        still: e.still, runtime: e.runtime, views: e.views, downloads: e.downloads,
        servers: db.prepare("SELECT id,name,url,kind,sort,is_default FROM servers WHERE parent_type='episode' AND parent_id=? ORDER BY is_default DESC, sort, id").all(e.id),
        downloads: db.prepare("SELECT id,quality,size,url FROM download_links WHERE parent_type='episode' AND parent_id=? ORDER BY id").all(e.id),
      })),
    }));
  }
  res.json(out);
});

// ---------- tracking ----------
app.post('/api/track/visit', async (req, res) => {
  const { visitor, path: p } = req.body || {};
  if (!visitor || typeof visitor !== 'string' || visitor.length > 80) return res.status(400).end();
  const country = await geoLookup(clientIp(req));
  db.prepare('INSERT INTO visits(visitor,date,path,country,ts) VALUES (?,?,?,?,?)')
    .run(visitor, today(), String(p || '/').slice(0, 200), country, Date.now());
  res.json({ ok: true });
});

app.post('/api/track/event', (req, res) => {
  const { kind, title_id, episode_id, quality } = req.body || {};
  if (!['view', 'download'].includes(kind)) return res.status(400).end();
  db.prepare('INSERT INTO events(kind,title_id,episode_id,quality,date,ts) VALUES (?,?,?,?,?,?)')
    .run(kind, title_id || null, episode_id || null, quality || null, today(), Date.now());
  if (kind === 'view') {
    if (title_id) db.prepare('UPDATE titles SET views=views+1 WHERE id=?').run(title_id);
    if (episode_id) db.prepare('UPDATE episodes SET views=views+1 WHERE id=?').run(episode_id);
  } else {
    if (title_id) db.prepare('UPDATE titles SET downloads=downloads+1 WHERE id=?').run(title_id);
    if (episode_id) db.prepare('UPDATE episodes SET downloads=downloads+1 WHERE id=?').run(episode_id);
  }
  res.json({ ok: true });
});

// ---------- admin auth ----------
app.post('/api/admin/login', (req, res) => {
  const pass = String((req.body || {}).pass || '');
  const real = getSetting('admin_pass', '9770327');
  const a = Buffer.from(pass), b = Buffer.from(real);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'wrong_pass' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions(token,created,expires) VALUES (?,?,?)').run(token, Date.now(), Date.now() + SESSION_TTL);
  res.setHeader('Set-Cookie', `naz_admin=${token}; Path=/; Max-Age=${SESSION_TTL / 1000}; HttpOnly; SameSite=Lax`);
  res.json({ token, expires_in_days: 30 });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = cookieToken(req);
  db.prepare('DELETE FROM sessions WHERE token=?').run(token);
  res.setHeader('Set-Cookie', 'naz_admin=; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ ok: true }));

// ---------- admin: content CRUD ----------
const TITLE_FIELDS = ['type', 'tmdb_id', 'title', 'title_ar', 'overview', 'overview_ar', 'poster', 'backdrop', 'year', 'rating', 'runtime', 'genres', 'featured', 'country'];

app.post('/api/admin/titles', requireAdmin, (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.type) return res.status(400).json({ error: 'title & type required' });
  const fields = TITLE_FIELDS.filter(f => b[f] !== undefined);
  const vals = fields.map(f => f === 'genres' ? JSON.stringify(b.genres || []) : b[f]);
  const info = db.prepare(`INSERT INTO titles(${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`).run(...vals);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/admin/titles/:id', requireAdmin, (req, res) => {
  const b = req.body || {};
  const fields = TITLE_FIELDS.filter(f => b[f] !== undefined);
  if (!fields.length) return res.status(400).end();
  const vals = fields.map(f => f === 'genres' ? JSON.stringify(b.genres || []) : b[f]);
  db.prepare(`UPDATE titles SET ${fields.map(f => f + '=?').join(',')} WHERE id=?`).run(...vals, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/titles/:id', requireAdmin, (req, res) => {
  const id = +req.params.id;
  const epIds = db.prepare('SELECT e.id FROM episodes e JOIN seasons s ON e.season_id=s.id WHERE s.title_id=?').all(id).map(r => r.id);
  const del = db.transaction(() => {
    db.prepare("DELETE FROM servers WHERE parent_type='title' AND parent_id=?").run(id);
    db.prepare("DELETE FROM download_links WHERE parent_type='title' AND parent_id=?").run(id);
    epIds.forEach(e => {
      db.prepare("DELETE FROM servers WHERE parent_type='episode' AND parent_id=?").run(e);
      db.prepare("DELETE FROM download_links WHERE parent_type='episode' AND parent_id=?").run(e);
    });
    db.prepare('DELETE FROM titles WHERE id=?').run(id);
  });
  del();
  res.json({ ok: true });
});

// servers
app.post('/api/admin/servers', requireAdmin, (req, res) => {
  const { parent_type, parent_id, name, url, kind, sort, is_default } = req.body || {};
  if (!['title', 'episode'].includes(parent_type) || !name || !url) return res.status(400).json({ error: 'invalid' });
  const maxSort = db.prepare('SELECT COALESCE(MAX(sort),0) m FROM servers WHERE parent_type=? AND parent_id=?').get(parent_type, parent_id).m;
  const tx = db.transaction(() => {
    if (is_default) db.prepare('UPDATE servers SET is_default=0 WHERE parent_type=? AND parent_id=?').run(parent_type, parent_id);
    const info = db.prepare('INSERT INTO servers(parent_type,parent_id,name,url,kind,sort,is_default) VALUES (?,?,?,?,?,?,?)')
      .run(parent_type, parent_id, name, url, kind === 'mp4' ? 'mp4' : 'embed', sort ?? (maxSort + 1), is_default ? 1 : 0);
    return info.lastInsertRowid;
  });
  res.json({ id: tx() });
});
app.put('/api/admin/servers/:id', requireAdmin, (req, res) => {
  const { name, url, kind, sort, is_default } = req.body || {};
  const s = db.prepare('SELECT * FROM servers WHERE id=?').get(req.params.id);
  if (!s) return res.status(404).end();
  const tx = db.transaction(() => {
    if (is_default) db.prepare('UPDATE servers SET is_default=0 WHERE parent_type=? AND parent_id=?').run(s.parent_type, s.parent_id);
    db.prepare('UPDATE servers SET name=COALESCE(?,name), url=COALESCE(?,url), kind=COALESCE(?,kind), sort=COALESCE(?,sort), is_default=COALESCE(?,is_default) WHERE id=?')
      .run(name ?? null, url ?? null, kind ?? null, sort ?? null, is_default !== undefined ? (is_default ? 1 : 0) : null, s.id);
  });
  tx();
  res.json({ ok: true });
});
app.post('/api/admin/servers/reorder', requireAdmin, (req, res) => {
  const { parent_type, parent_id, ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).end();
  const upd = db.prepare('UPDATE servers SET sort=? WHERE id=? AND parent_type=? AND parent_id=?');
  const tx = db.transaction(() => ids.forEach((id, i) => upd.run(i + 1, id, parent_type, parent_id)));
  tx();
  res.json({ ok: true });
});
app.delete('/api/admin/servers/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM servers WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// download links
app.post('/api/admin/downloads', requireAdmin, (req, res) => {
  const { parent_type, parent_id, quality, size, url } = req.body || {};
  if (!['title', 'episode'].includes(parent_type) || !quality || !url) return res.status(400).json({ error: 'invalid' });
  const info = db.prepare('INSERT INTO download_links(parent_type,parent_id,quality,size,url) VALUES (?,?,?,?,?)')
    .run(parent_type, parent_id, quality, size || '', url);
  res.json({ id: info.lastInsertRowid });
});
app.put('/api/admin/downloads/:id', requireAdmin, (req, res) => {
  const { quality, size, url } = req.body || {};
  db.prepare('UPDATE download_links SET quality=COALESCE(?,quality), size=COALESCE(?,size), url=COALESCE(?,url) WHERE id=?')
    .run(quality ?? null, size ?? null, url ?? null, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/admin/downloads/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM download_links WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// seasons / episodes
app.post('/api/admin/titles/:id/seasons', requireAdmin, (req, res) => {
  const info = db.prepare('INSERT INTO seasons(title_id,number,name) VALUES (?,?,?)')
    .run(req.params.id, req.body.number || 1, req.body.name || '');
  res.json({ id: info.lastInsertRowid });
});
app.delete('/api/admin/seasons/:id', requireAdmin, (req, res) => {
  const epIds = db.prepare('SELECT id FROM episodes WHERE season_id=?').all(req.params.id).map(r => r.id);
  const del = db.transaction(() => {
    epIds.forEach(e => {
      db.prepare("DELETE FROM servers WHERE parent_type='episode' AND parent_id=?").run(e);
      db.prepare("DELETE FROM download_links WHERE parent_type='episode' AND parent_id=?").run(e);
    });
    db.prepare('DELETE FROM seasons WHERE id=?').run(req.params.id);
  });
  del();
  res.json({ ok: true });
});
app.post('/api/admin/seasons/:id/episodes', requireAdmin, (req, res) => {
  const b = req.body || {};
  const info = db.prepare('INSERT INTO episodes(season_id,number,name,name_ar,overview,runtime) VALUES (?,?,?,?,?,?)')
    .run(req.params.id, b.number || 1, b.name || '', b.name_ar || '', b.overview || '', b.runtime || null);
  res.json({ id: info.lastInsertRowid });
});
app.put('/api/admin/episodes/:id', requireAdmin, (req, res) => {
  const b = req.body || {};
  const fields = ['number', 'name', 'name_ar', 'overview', 'still', 'runtime'].filter(f => b[f] !== undefined);
  if (!fields.length) return res.status(400).end();
  db.prepare(`UPDATE episodes SET ${fields.map(f => f + '=?').join(',')} WHERE id=?`).run(...fields.map(f => b[f]), req.params.id);
  res.json({ ok: true });
});
app.delete('/api/admin/episodes/:id', requireAdmin, (req, res) => {
  db.prepare("DELETE FROM servers WHERE parent_type='episode' AND parent_id=?").run(req.params.id);
  db.prepare("DELETE FROM download_links WHERE parent_type='episode' AND parent_id=?").run(req.params.id);
  db.prepare('DELETE FROM episodes WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- admin: app download button ----------
app.get('/api/admin/app', requireAdmin, (req, res) => {
  res.json({
    enabled: getSetting('app_enabled', '0') === '1',
    url: getSetting('app_url', ''),
    text: getSetting('app_text', ''),
  });
});
app.put('/api/admin/app', requireAdmin, (req, res) => {
  const b = req.body || {};
  setSetting('app_enabled', b.enabled ? '1' : '0');
  setSetting('app_url', String(b.url || '').slice(0, 1000));
  setSetting('app_text', String(b.text || '').slice(0, 60));
  res.json({ ok: true });
});

// ---------- admin: ads & settings ----------
app.get('/api/admin/ads', requireAdmin, (req, res) => res.json(readAds()));
app.put('/api/admin/ads', requireAdmin, (req, res) => {
  const b = req.body || {};
  const clean = {
    banners: (Array.isArray(b.banners) ? b.banners : []).slice(0, 10).map((x, i) => ({
      id: x.id || i + 1,
      enabled: !!x.enabled,
      position: x.position === 'bottom' ? 'bottom' : 'top',
      code: String(x.code || '').slice(0, 8000),
    })),
    popunder: {
      enabled: !!(b.popunder || {}).enabled,
      code: String((b.popunder || {}).code || '').slice(0, 8000),
      freq_hours: Math.min(168, Math.max(1, +(b.popunder || {}).freq_hours || 24)),
    },
    player: {
      enabled: !!(b.player || {}).enabled,
      mode: (b.player || {}).mode === 'code' ? 'code' : 'text',
      content: String((b.player || {}).content || '').slice(0, 8000),
      link: String((b.player || {}).link || '').slice(0, 2000),
      position: (b.player || {}).position === 'above' ? 'above' : 'below',
    },
  };
  setSetting('ads', JSON.stringify(clean));
  res.json({ ok: true });
});

app.get('/api/admin/settings', requireAdmin, (req, res) => {
  res.json({
    site_name: getSetting('site_name', 'NazMovies'),
    default_lang: getSetting('default_lang', 'ar'),
    tmdb_key: getSetting('tmdb_key', ''),
  });
});
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const b = req.body || {};
  if (b.site_name !== undefined) setSetting('site_name', String(b.site_name).slice(0, 60));
  if (b.default_lang !== undefined) setSetting('default_lang', b.default_lang === 'en' ? 'en' : 'ar');
  if (b.tmdb_key !== undefined) setSetting('tmdb_key', String(b.tmdb_key).slice(0, 80));
  if (b.admin_pass && String(b.admin_pass).length >= 4) setSetting('admin_pass', String(b.admin_pass).slice(0, 40));
  res.json({ ok: true });
});

// ---------- admin: TMDB ----------
async function tmdb(endpoint, params = {}) {
  const key = getSetting('tmdb_key', '');
  if (!key) throw new Error('no_tmdb_key');
  const url = new URL('https://api.themoviedb.org/3/' + endpoint);
  url.searchParams.set('api_key', key);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url);
  if (!r.ok) throw new Error('tmdb_' + r.status);
  return r.json();
}

app.get('/api/admin/tmdb/search', requireAdmin, async (req, res) => {
  try {
    const { query, type } = req.query;
    if (!query) return res.json({ results: [] });
    const j = await tmdb(type === 'tv' ? 'search/tv' : 'search/movie', { query, include_adult: 'false', language: 'en-US' });
    res.json(j.results.slice(0, 12).map(r => ({
      tmdb_id: r.id,
      type: type === 'tv' ? 'series' : 'movie',
      title: r.title || r.name,
      year: (r.release_date || r.first_air_date || '').slice(0, 4),
      poster: r.poster_path ? TMDB_IMG + 'w500' + r.poster_path : null,
      backdrop: r.backdrop_path ? TMDB_IMG + 'w1280' + r.backdrop_path : null,
      rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : 0,
      overview: r.overview || '',
    })));
  } catch (e) {
    res.status(e.message === 'no_tmdb_key' ? 400 : 502).json({ error: e.message });
  }
});

app.post('/api/admin/tmdb/import', requireAdmin, async (req, res) => {
  try {
    const { tmdb_id, type } = req.body || {};
    if (!tmdb_id) return res.status(400).json({ error: 'tmdb_id required' });
    const isTv = type === 'series' || type === 'tv';
    const [en, ar] = await Promise.all([
      tmdb((isTv ? 'tv/' : 'movie/') + tmdb_id, { language: 'en-US' }),
      tmdb((isTv ? 'tv/' : 'movie/') + tmdb_id, { language: 'ar-SA' }).catch(() => null),
    ]);
    const info = db.prepare(`INSERT INTO titles(type,tmdb_id,title,title_ar,overview,overview_ar,poster,backdrop,year,rating,runtime,genres,featured)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`).run(
      isTv ? 'series' : 'movie', tmdb_id,
      en.title || en.name, (ar && (ar.title || ar.name)) || null,
      en.overview || '', (ar && ar.overview) || '',
      en.poster_path ? TMDB_IMG + 'w500' + en.poster_path : null,
      en.backdrop_path ? TMDB_IMG + 'w1280' + en.backdrop_path : null,
      +((en.release_date || en.first_air_date || '').slice(0, 4)) || null,
      en.vote_average ? Math.round(en.vote_average * 10) / 10 : 0,
      en.runtime || (en.episode_run_time && en.episode_run_time[0]) || null,
      JSON.stringify((en.genres || []).map(g => g.id)),
    );
    const titleId = info.lastInsertRowid;
    if (isTv && Array.isArray(en.seasons)) {
      for (const s of en.seasons.filter(x => x.season_number > 0)) {
        const sid = db.prepare('INSERT INTO seasons(title_id,number,name) VALUES (?,?,?)')
          .run(titleId, s.season_number, s.name || 'Season ' + s.season_number).lastInsertRowid;
        try {
          const det = await tmdb(`tv/${tmdb_id}/season/${s.season_number}`, { language: 'en-US' });
          const detAr = await tmdb(`tv/${tmdb_id}/season/${s.season_number}`, { language: 'ar-SA' }).catch(() => null);
          for (const ep of det.episodes || []) {
            const epAr = detAr && detAr.episodes ? detAr.episodes.find(x => x.episode_number === ep.episode_number) : null;
            db.prepare('INSERT INTO episodes(season_id,number,name,name_ar,overview,still,runtime) VALUES (?,?,?,?,?,?,?)')
              .run(sid, ep.episode_number, ep.name || '', (epAr && epAr.name) || '',
                ep.overview || '', ep.still_path ? TMDB_IMG + 'w300' + ep.still_path : null, ep.runtime || null);
          }
        } catch { /* season fetch failed — skip */ }
      }
    }
    res.json({ id: titleId });
  } catch (e) {
    res.status(e.message === 'no_tmdb_key' ? 400 : 502).json({ error: e.message });
  }
});

// ---------- admin: analytics ----------
app.get('/api/admin/analytics', requireAdmin, (req, res) => {
  const visitsBy = (cond) => db.prepare(`SELECT COUNT(DISTINCT visitor) c FROM visits WHERE ${cond}`).get().c;
  const pvBy = (cond) => db.prepare(`SELECT COUNT(*) c FROM visits WHERE ${cond}`).get().c;
  const evBy = (kind, cond) => db.prepare(`SELECT COUNT(*) c FROM events WHERE kind='${kind}' AND ${cond}`).get().c;

  const daily = [];
  for (let d = 29; d >= 0; d--) {
    const date = dayOffset(d);
    daily.push({
      date,
      visits: visitsBy('date = ' + sqlq(date)),
      pageviews: pvBy('date = ' + sqlq(date)),
      views: evBy('view', 'date = ' + sqlq(date)),
      downloads: evBy('download', 'date = ' + sqlq(date)),
    });
  }
  const countries = db.prepare(`
    SELECT country, COUNT(DISTINCT visitor) visitors, COUNT(*) pageviews
    FROM visits GROUP BY country ORDER BY visitors DESC LIMIT 14`).all();
  const totalVisitors = countries.reduce((a, c) => a + c.visitors, 0) || 1;
  countries.forEach(c => c.pct = Math.round((c.visitors / totalVisitors) * 1000) / 10);

  const topViews = db.prepare('SELECT id,title,title_ar,type,poster,views,downloads FROM titles ORDER BY views DESC LIMIT 10').all();
  const topDownloads = db.prepare('SELECT id,title,title_ar,type,poster,views,downloads FROM titles ORDER BY downloads DESC LIMIT 10').all();
  const topEpisodes = db.prepare(`
    SELECT e.id, e.name, e.views, e.downloads, t.title, t.title_ar FROM episodes e
    JOIN seasons s ON e.season_id = s.id JOIN titles t ON s.title_id = t.id
    ORDER BY e.views DESC LIMIT 10`).all();
  const dlByQuality = db.prepare("SELECT quality, COUNT(*) c FROM events WHERE kind='download' AND quality IS NOT NULL GROUP BY quality ORDER BY c DESC").all();

  res.json({
    totals: {
      today_visits: visitsBy(`date = ${sqlq(today())}`),
      week_visits: visitsBy(`date >= ${sqlq(dayOffset(6))}`),
      month_visits: visitsBy(`date >= ${sqlq(dayOffset(29))}`),
      all_visits: visitsBy('1=1'),
      pageviews: pvBy('1=1'),
      views: evBy('view', '1=1'),
      downloads: evBy('download', '1=1'),
      titles: db.prepare('SELECT COUNT(*) c FROM titles').get().c,
      episodes: db.prepare('SELECT COUNT(*) c FROM episodes').get().c,
    },
    daily, countries, topViews, topDownloads, topEpisodes, dlByQuality,
  });
});

app.listen(PORT, '0.0.0.0', () => console.log(`NazMovies running on http://0.0.0.0:${PORT}`));
