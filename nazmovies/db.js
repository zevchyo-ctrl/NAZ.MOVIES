// NazMovies — database layer + seed data
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'nazmovies.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS titles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL DEFAULT 'movie',
  tmdb_id INTEGER,
  title TEXT NOT NULL,
  title_ar TEXT,
  overview TEXT,
  overview_ar TEXT,
  poster TEXT,
  backdrop TEXT,
  year INTEGER,
  rating REAL DEFAULT 0,
  runtime INTEGER,
  genres TEXT DEFAULT '[]',
  featured INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  name TEXT
);
CREATE TABLE IF NOT EXISTS episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  name TEXT,
  name_ar TEXT,
  overview TEXT,
  still TEXT,
  runtime INTEGER,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_type TEXT NOT NULL,          -- 'title' | 'episode'
  parent_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  kind TEXT DEFAULT 'embed',          -- 'embed' | 'mp4'
  sort INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_servers_parent ON servers(parent_type, parent_id);
CREATE TABLE IF NOT EXISTS download_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_type TEXT NOT NULL,          -- 'title' | 'episode'
  parent_id INTEGER NOT NULL,
  quality TEXT NOT NULL,
  size TEXT,
  url TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dl_parent ON download_links(parent_type, parent_id);
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor TEXT NOT NULL,
  date TEXT NOT NULL,                 -- YYYY-MM-DD
  path TEXT,
  country TEXT,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,                 -- 'view' | 'download'
  title_id INTEGER,
  episode_id INTEGER,
  quality TEXT,
  date TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_title ON events(title_id);
CREATE TABLE IF NOT EXISTS geo_cache (
  ip TEXT PRIMARY KEY,
  country TEXT,
  ts INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  created INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
`);

// ---------- lightweight migrations (existing DBs) ----------
function ensureCol(table, col, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}
ensureCol('titles', 'country', 'country TEXT');
ensureCol('servers', 'is_default', 'is_default INTEGER DEFAULT 0');

const getSetting = db.prepare('SELECT value FROM settings WHERE key=?');
const setSetting = db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');

function get(key, fallback = '') {
  const r = getSetting.get(key);
  return r ? r.value : fallback;
}
function set(key, value) { setSetting.run(key, String(value)); }

// ---------- SEED ----------
function seedIfEmpty() {
  const n = db.prepare('SELECT COUNT(*) c FROM titles').get().c;
  if (n > 0) return false;

  const A = 86400000;
  const day = (offset) => new Date(Date.now() - offset * A).toISOString().slice(0, 10);

  set('admin_pass', '9770327');
  set('site_name', 'NazMovies');
  set('default_lang', 'ar');
  set('tmdb_key', '');
  set('ads', JSON.stringify([
    { id: 1, name: 'Popunder (مثال)', script: '<!-- PopAds / Adsterra script here -->\n', enabled: false },
  ]));

  const insTitle = db.prepare(`INSERT INTO titles
    (type,title,title_ar,overview,overview_ar,poster,backdrop,year,rating,runtime,genres,featured,views,downloads)
    VALUES (@type,@title,@title_ar,@overview,@overview_ar,@poster,@backdrop,@year,@rating,@runtime,@genres,@featured,@views,@downloads)`);
  const insSeason = db.prepare('INSERT INTO seasons(title_id,number,name) VALUES (?,?,?)');
  const insEp = db.prepare('INSERT INTO episodes(season_id,number,name,name_ar,overview,still,runtime,views,downloads) VALUES (?,?,?,?,?,?,?,?,?)');
  const insServer = db.prepare('INSERT INTO servers(parent_type,parent_id,name,url,kind,sort) VALUES (?,?,?,?,?,?)');
  const insDl = db.prepare('INSERT INTO download_links(parent_type,parent_id,quality,size,url) VALUES (?,?,?,?,?)');

  const V1 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const V2 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';

  const titles = [
    { type: 'movie', title: 'Desert Storm', title_ar: 'عاصفة الصحراء',
      overview: 'An elite soldier is left behind enemy lines as a colossal sandstorm approaches. With only hours before the storm swallows everything, he must cross 200 km of hostile desert to warn his unit.',
      overview_ar: 'جندي من القوات الخاصة يُترك خلف خطوط العدو مع اقتراب عاصفة رملية هائلة. أمامه ساعات قليلة ليعبر 200 كيلومتر من الصحراء العدائية لتحذير وحدته قبل أن تبتلع العاصفة كل شيء.',
      poster: '/assets/p1.jpg', backdrop: '/assets/b1.jpg', year: 2026, rating: 8.4, runtime: 128,
      genres: JSON.stringify([28, 53]), featured: 1, views: 15234, downloads: 5310 },
    { type: 'movie', title: 'Neon Nights', title_ar: 'ليالي النيون',
      overview: 'A retired detective is pulled back into the neon-lit underworld of the city when a hacker leaves clues only he can read.',
      overview_ar: 'محقق متقاعد يجد نفسه مجدداً في عالم الجريمة المضاء بأضواء النيون عندما يترك قرصان غامض أدلة لا يستطيع قراءتها سواه.',
      poster: '/assets/p2.jpg', backdrop: '/assets/b2.jpg', year: 2025, rating: 7.9, runtime: 114,
      genres: JSON.stringify([80, 53]), featured: 1, views: 11876, downloads: 4022 },
    { type: 'movie', title: 'The Last Map', title_ar: 'الخريطة الأخيرة',
      overview: 'A young cartographer discovers an ancient map pointing to a city lost beneath the sands — but a ruthless collector is one step behind her.',
      overview_ar: 'رسّامة خرائط شابة تكتشف خريطة قديمة تشير إلى مدينة مفقودة تحت الرمال، لكن جامع تحف قاسٍ يلاحقها خطوة بخطوة.',
      poster: '/assets/p3.jpg', backdrop: '/assets/p3.jpg', year: 2024, rating: 8.1, runtime: 121,
      genres: JSON.stringify([12, 28]), featured: 1, views: 9540, downloads: 3108 },
    { type: 'movie', title: 'Orbit Zero', title_ar: 'المدار صفر',
      overview: 'When an experimental space station loses contact with Earth, its crew of six must survive a cascade of failures — and the silence between them.',
      overview_ar: 'عندما تفقد محطة فضائية تجريبية الاتصال بالأرض، يجد طاقمها المكوّن من ستة أفراد أنفسهم في صراع من أجل النجاة وسط سلسلة أعطال غامضة.',
      poster: '/assets/p4.jpg', backdrop: '/assets/p4.jpg', year: 2026, rating: 8.8, runtime: 139,
      genres: JSON.stringify([878]), featured: 0, views: 13301, downloads: 4761 },
    { type: 'movie', title: 'Nile Curse', title_ar: 'لعنة النيل',
      overview: 'A museum night-guard discovers that the newest exhibit — a 3000-year-old statue — changes position every time the lights go out.',
      overview_ar: 'حارس متحف ليلي يكتشف أن أحدث القطع المعروضة، تمثال عمره 3000 عام، يغيّر مكانه كلما انطفأت الأضواء.',
      poster: '/assets/p5.jpg', backdrop: '/assets/p5.jpg', year: 2023, rating: 6.9, runtime: 101,
      genres: JSON.stringify([27]), featured: 0, views: 6204, downloads: 1877 },
    { type: 'movie', title: 'Golden Sands', title_ar: 'رمال الذهب',
      overview: 'Five strangers. One impossible vault buried under a luxury resort. The perfect heist — if they do not betray each other first.',
      overview_ar: 'خمسة غرباء وخزنة مستحيلة مدفونة تحت منتجع فاخر. السرقة المثالية.. إن لم يخن أحدهم الآخر أولاً.',
      poster: '/assets/p6.jpg', backdrop: '/assets/p6.jpg', year: 2024, rating: 7.5, runtime: 118,
      genres: JSON.stringify([80, 53]), featured: 0, views: 8122, downloads: 2945 },
    { type: 'series', title: 'The Kingdom', title_ar: 'المملكة',
      overview: 'The rise of a young ruler facing conspiracies inside his own palace, told across two turbulent decades of power, loyalty and betrayal.',
      overview_ar: 'صعود حاكم شاب يواجه مؤامرات داخل قصره، عبر عقدين مضطربين من السلطة والولاء والخيانة.',
      poster: '/assets/p7.jpg', backdrop: '/assets/p7.jpg', year: 2025, rating: 8.6, runtime: null,
      genres: JSON.stringify([18, 36]), featured: 0, views: 17245, downloads: 6201 },
    { type: 'series', title: 'Code 77', title_ar: 'الشيفرة 77',
      overview: 'A young hacker discovers a backdoor into the city\u2019s surveillance grid — and someone on the other side has already noticed her.',
      overview_ar: 'قرصانة شابة تكتشف ثغرة في شبكة المراقبة في المدينة، وهناك من لاحظ وجودها في الجهة الأخرى.',
      poster: '/assets/p8.jpg', backdrop: '/assets/p8.jpg', year: 2026, rating: 8.2, runtime: null,
      genres: JSON.stringify([80, 878]), featured: 0, views: 10933, downloads: 3988 },
  ];

  const epNames = [
    ['The Oath', 'القَسَم', 'A coronation interrupted by betrayal.'],
    ['Ashes', 'رماد', 'The palace burns; loyalties are tested.'],
    ['The Alliance', 'التحالف', 'A marriage of politics, not love.'],
    ['Exile', 'المنفى', 'The price of mercy is banishment.'],
    ['The Return', 'العودة', 'An army in the desert demands a king.'],
    ['The Crown', 'التاج', 'Everything returns to where it began.'],
    ['Old Wounds', 'جراح قديمة', 'An enemy from the past resurfaces.'],
    ['The Siege', 'الحصار', 'Winter comes for the capital.'],
    ['Judgement', 'الحُكم', 'The final reckoning of a dynasty.'],
  ];

  const insertAll = db.transaction(() => {
    titles.forEach((t, ti) => {
      const id = insTitle.run(t).lastInsertRowid;
      if (t.type === 'movie') {
        insServer.run('title', id, 'Server 1', V1, 'mp4', 1);
        insServer.run('title', id, 'Server 2', 'https://vidsrc.example/embed/movie/' + id, 'embed', 2);
        insServer.run('title', id, 'Server 3', V2, 'mp4', 3);
        insDl.run('title', id, '480p', '450 MB', V1);
        insDl.run('title', id, '720p', '1.1 GB', V1);
        insDl.run('title', id, '1080p', '2.3 GB', V2);
      } else {
        const epCount = id === 7 ? 6 : 5;
        const s1 = insSeason.run(id, 1, 'Season 1').lastInsertRowid;
        for (let e = 1; e <= epCount; e++) {
          const [en, ar, ov] = epNames[(e - 1) % epNames.length];
          const epId = insEp.run(s1, e, 'Episode ' + e + ': ' + en, 'الحلقة ' + e, ov, '/assets/p' + (ti + 1) + '.jpg', 45 + e,
            Math.round(t.views / (epCount * 1.6)) + e * 37, Math.round(t.downloads / (epCount * 2))).lastInsertRowid;
          insServer.run('episode', epId, 'Server 1', V1, 'mp4', 1);
          insServer.run('episode', epId, 'Server 2', 'https://vidsrc.example/embed/tv/' + id + '/' + e, 'embed', 2);
          insDl.run('episode', epId, '480p', '300 MB', V1);
          insDl.run('episode', epId, '720p', '750 MB', V2);
          insDl.run('episode', epId, '1080p', '1.4 GB', V2);
        }
        if (id === 7) {
          const s2 = insSeason.run(id, 2, 'Season 2').lastInsertRowid;
          for (let e = 1; e <= 3; e++) {
            const [en, ar, ov] = epNames[5 + e];
            const epId = insEp.run(s2, e, 'Episode ' + e + ': ' + en, 'الحلقة ' + e, ov, '/assets/p7.jpg', 50,
              900 + e * 55, 320 + e * 21).lastInsertRowid;
            insServer.run('episode', epId, 'Server 1', V1, 'mp4', 1);
            insDl.run('episode', epId, '720p', '780 MB', V2);
            insDl.run('episode', epId, '1080p', '1.5 GB', V2);
          }
        }
      }
    });

    // ---- synthetic analytics history (demo) ----
    const countries = [
      ['Sudan', 26], ['Egypt', 18], ['Saudi Arabia', 14], ['United Arab Emirates', 8],
      ['Jordan', 6], ['Kuwait', 5], ['Morocco', 5], ['Iraq', 4], ['Germany', 6],
      ['United States', 5], ['Turkey', 3], ['France', 2], ['Qatar', 2],
    ];
    const pool = [];
    countries.forEach(([c, w]) => { for (let i = 0; i < w; i++) pool.push(c); });
    let rnd = 42;
    const rand = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
    const insVisit = db.prepare('INSERT INTO visits(visitor,date,path,country,ts) VALUES (?,?,?,?,?)');
    const insEvent = db.prepare('INSERT INTO events(kind,title_id,episode_id,quality,date,ts) VALUES (?,?,?,?,?,?)');
    for (let d = 29; d >= 0; d--) {
      const base = 45 + Math.round(rand() * 95) + (d < 7 ? 30 : 0);
      const date = day(d);
      for (let v = 0; v < base; v++) {
        const visitor = 'demo_' + d + '_' + v;
        const pageviews = 1 + Math.floor(rand() * 4);
        const country = pool[Math.floor(rand() * pool.length)];
        for (let p = 0; p < pageviews; p++) {
          insVisit.run(visitor, date, p === 0 ? '/' : '/title.html?id=' + (1 + Math.floor(rand() * 8)), country, Date.now() - d * A);
        }
      }
      // views/downloads events
      for (let e = 0; e < Math.round(base * 0.7); e++) {
        insEvent.run('view', 1 + Math.floor(rand() * 8), null, null, date, Date.now() - d * A);
      }
      for (let e = 0; e < Math.round(base * 0.3); e++) {
        insEvent.run('download', 1 + Math.floor(rand() * 8), null, ['480p', '720p', '1080p'][Math.floor(rand() * 3)], date, Date.now() - d * A);
      }
    }
  });
  insertAll();
  return true;
}

seedIfEmpty();

module.exports = { db, getSetting: get, setSetting: set };
