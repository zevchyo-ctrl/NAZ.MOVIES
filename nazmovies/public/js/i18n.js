// NazMovies — i18n (Arabic / English) with RTL/LTR switching
const I18N = {
  en: {
    dir: 'ltr', lang_btn: 'عربي',
    home: 'Home', movies: 'Movies', series: 'Series', search_ph: 'Search movies & series…',
    watch_now: 'Watch Now', download: 'Download', more_info: 'Details',
    featured_tag: 'NazMovies Featured',
    r_trending: 'Trending Now', r_latest: 'Latest Releases', r_movies: 'Movies', r_series: 'Series',
    r_action: 'Action & Adventure', r_scifi: 'Sci-Fi', r_crime: 'Crime & Thriller', r_horror: 'Horror',
    items: 'titles',
    browse_movies: 'All Movies', browse_series: 'All Series', no_results: 'No results found',
    servers: 'Streaming Servers', downloads_hd: 'Download Links', size: 'Size', no_links: 'No links available yet',
    episodes: 'Episodes', season: 'Season', ep: 'Ep.',
    views: 'views', dl_count: 'downloads', min: 'min', seasons: 'Seasons',
    about: 'Story', choose_ep: 'Choose an episode',
    footer_note: 'Demo catalog — add your own licensed content from the dashboard.',
    rights: 'All rights reserved',
    passcode_title: 'Restricted Area', passcode_hint: 'Enter the passcode to continue', wrong_pass: 'Wrong passcode, try again',
    // admin
    a_overview: 'Overview', a_content: 'Content', a_ads: 'Ads & Popunders', a_settings: 'Settings', a_logout: 'Logout',
    a_back_site: 'View Site',
    t_today: 'Visits Today', t_week: 'Visits (7 days)', t_month: 'Visits (30 days)', t_all: 'Total Visitors',
    t_pv: 'Pageviews', t_views: 'Watch Clicks', t_dls: 'Downloads', t_titles: 'Titles', t_eps: 'Episodes',
    traffic_30: 'Traffic — last 30 days', countries: 'Visitors by Country', top_views: 'Most Watched', top_dls: 'Most Downloaded',
    top_eps: 'Top Episodes', dl_quality: 'Downloads by Quality', legend_visits: 'Visitors', legend_views: 'Watch', legend_dls: 'Downloads',
    add_title: 'Add Manually', import_tmdb: 'Import from TMDB', tmdb_ph: 'Search TMDB by name…', search: 'Search',
    type: 'Type', movie: 'Movie', serie: 'Series', edit: 'Edit', del: 'Delete', save: 'Save', close: 'Close',
    title_f: 'Title (EN)', title_ar_f: 'Title (AR)', overview_f: 'Overview (EN)', overview_ar_f: 'Overview (AR)',
    poster_f: 'Poster URL', backdrop_f: 'Backdrop URL', year_f: 'Year', rating_f: 'Rating', runtime_f: 'Runtime (min)',
    genres_f: 'Genres', featured_f: 'Featured on homepage', servers_m: 'Servers & Downloads', basic: 'Basic Info',
    seasons_m: 'Seasons & Episodes', add_season: 'Add Season', add_ep: 'Add Episode', edit_ep: 'Edit Episode',
    server_name: 'Server name', server_url: 'Stream / embed URL', kind: 'Kind', mp4: 'Direct MP4', embed: 'Embed (iframe)',
    add_server: 'Add Server', quality_f: 'Quality (e.g. 1080p)', size_f: 'Size (e.g. 1.2 GB)', link_url: 'Download URL',
    add_link: 'Add Link', confirm_del: 'Confirm delete? This cannot be undone.',
    ads_hint: 'Paste ad / popunder scripts (e.g. PopAds, Adsterra). They are injected on public pages only when enabled — edit here without touching site files.',
    ad_name: 'Ad name', ad_script: 'Script code', ad_enabled: 'Enabled', add_ad: 'Add Ad Slot', save_ads: 'Save Ads',
    site_name: 'Site name', default_lang: 'Default language', tmdb_key: 'TMDB API key', tmdb_hint: 'Get a free key at themoviedb.org → Settings → API',
    admin_pass: 'Admin passcode', pass_hint: 'Leave empty to keep current (9770327)',
    saved: 'Saved successfully', deleted: 'Deleted', imported_ok: 'Imported — now add your servers below', err: 'Error',
    no_tmdb: 'Add your TMDB API key in Settings first',
    login_admin: 'Admin Login',
    g28: 'Action', g12: 'Adventure', g35: 'Comedy', g80: 'Crime', g18: 'Drama', g27: 'Horror', g878: 'Sci-Fi', g53: 'Thriller', g36: 'History', g16: 'Animation', g10749: 'Romance', g14: 'Fantasy', g9648: 'Mystery',
    c_Sudan: 'Sudan', c_Egypt: 'Egypt', 'c_Saudi Arabia': 'Saudi Arabia', 'c_United Arab Emirates': 'UAE', c_Jordan: 'Jordan', c_Kuwait: 'Kuwait', c_Morocco: 'Morocco', c_Algeria: 'Algeria', c_Iraq: 'Iraq', c_Qatar: 'Qatar',
    'c_United States': 'USA', c_Germany: 'Germany', 'c_United Kingdom': 'UK', c_France: 'France', c_Turkey: 'Turkey', c_Unknown: 'Unknown', 'c_Local/Private': 'Local',
  },
  ar: {
    dir: 'rtl', lang_btn: 'EN',
    home: 'الرئيسية', movies: 'أفلام', series: 'مسلسلات', search_ph: 'ابحث عن أفلام ومسلسلات…',
    watch_now: 'مشاهدة الآن', download: 'تحميل', more_info: 'التفاصيل',
    featured_tag: 'مختارات NazMovies',
    r_trending: 'الأكثر رواجاً', r_latest: 'أحدث الإضافات', r_movies: 'أفلام', r_series: 'مسلسلات',
    r_action: 'أكشن ومغامرات', r_scifi: 'خيال علمي', r_crime: 'جريمة وإثارة', r_horror: 'رعب',
    items: 'عمل',
    browse_movies: 'جميع الأفلام', browse_series: 'جميع المسلسلات', no_results: 'لا توجد نتائج',
    servers: 'سيرفرات المشاهدة', downloads_hd: 'روابط التحميل', size: 'الحجم', no_links: 'لا توجد روابط بعد',
    episodes: 'الحلقات', season: 'الموسم', ep: 'ح',
    views: 'مشاهدة', dl_count: 'تحميل', min: 'دقيقة', seasons: 'مواسم',
    about: 'القصة', choose_ep: 'اختر حلقة',
    footer_note: 'كتالوج تجريبي — أضف محتواك المرخّص من لوحة التحكم.',
    rights: 'جميع الحقوق محفوظة',
    passcode_title: 'منطقة محظورة', passcode_hint: 'أدخل الرمز السري للمتابعة', wrong_pass: 'رمز خاطئ، حاول مجدداً',
    a_overview: 'نظرة عامة', a_content: 'المحتوى', a_ads: 'الإعلانات والبوب أندر', a_settings: 'الإعدادات', a_logout: 'خروج',
    a_back_site: 'عرض الموقع',
    t_today: 'زيارات اليوم', t_week: 'زيارات (7 أيام)', t_month: 'زيارات (30 يوم)', t_all: 'إجمالي الزوار',
    t_pv: 'مشاهدات الصفحات', t_views: 'نقرات المشاهدة', t_dls: 'التحميلات', t_titles: 'الأعمال', t_eps: 'الحلقات',
    traffic_30: 'الحركة — آخر 30 يوماً', countries: 'الزوار حسب الدولة', top_views: 'الأكثر مشاهدة', top_dls: 'الأكثر تحميلاً',
    top_eps: 'أفضل الحلقات', dl_quality: 'التحميلات حسب الجودة', legend_visits: 'الزوار', legend_views: 'مشاهدة', legend_dls: 'تحميل',
    add_title: 'إضافة يدوية', import_tmdb: 'استيراد من TMDB', tmdb_ph: 'ابحث في TMDB بالاسم…', search: 'بحث',
    type: 'النوع', movie: 'فيلم', serie: 'مسلسل', edit: 'تعديل', del: 'حذف', save: 'حفظ', close: 'إغلاق',
    title_f: 'العنوان (EN)', title_ar_f: 'العنوان (عربي)', overview_f: 'القصة (EN)', overview_ar_f: 'القصة (عربي)',
    poster_f: 'رابط البوستر', backdrop_f: 'رابط الخلفية', year_f: 'السنة', rating_f: 'التقييم', runtime_f: 'المدة (دقيقة)',
    genres_f: 'التصنيفات', featured_f: 'مميز في الرئيسية', servers_m: 'السيرفرات والتحميل', basic: 'البيانات الأساسية',
    seasons_m: 'المواسم والحلقات', add_season: 'إضافة موسم', add_ep: 'إضافة حلقة', edit_ep: 'تعديل الحلقة',
    server_name: 'اسم السيرفر', server_url: 'رابط المشاهدة / التضمين', kind: 'النوع', mp4: 'MP4 مباشر', embed: 'تضمين (iframe)',
    add_server: 'إضافة سيرفر', quality_f: 'الجودة (مثل 1080p)', size_f: 'الحجم (مثل 1.2 GB)', link_url: 'رابط التحميل',
    add_link: 'إضافة رابط', confirm_del: 'تأكيد الحذف؟ لا يمكن التراجع.',
    ads_hint: 'الصق سكربتات الإعلانات والبوب أندر (مثل PopAds أو Adsterra). تُحقن في صفحات الزوار فقط عند التفعيل — عدّلها من هنا دون لمس ملفات الموقع.',
    ad_name: 'اسم الإعلان', ad_script: 'كود السكربت', ad_enabled: 'مفعّل', add_ad: 'إضافة مساحة إعلانية', save_ads: 'حفظ الإعلانات',
    site_name: 'اسم الموقع', default_lang: 'اللغة الافتراضية', tmdb_key: 'مفتاح TMDB API', tmdb_hint: 'احصل على مفتاح مجاني من themoviedb.org ← Settings ← API',
    admin_pass: 'الرمز السري للوحة', pass_hint: 'اتركه فارغاً للإبقاء على الحالي (9770327)',
    saved: 'تم الحفظ بنجاح', deleted: 'تم الحذف', imported_ok: 'تم الاستيراد — أضف السيرفرات الآن', err: 'خطأ',
    no_tmdb: 'أضف مفتاح TMDB في الإعدادات أولاً',
    login_admin: 'دخول المدير',
    g28: 'أكشن', g12: 'مغامرة', g35: 'كوميديا', g80: 'جريمة', g18: 'دراما', g27: 'رعب', g878: 'خيال علمي', g53: 'إثارة', g36: 'تاريخي', g16: 'أنيميشن', g10749: 'رومانسي', g14: 'فانتازيا', g9648: 'غموض',
    c_Sudan: 'السودان', c_Egypt: 'مصر', 'c_Saudi Arabia': 'السعودية', 'c_United Arab Emirates': 'الإمارات', c_Jordan: 'الأردن', c_Kuwait: 'الكويت', c_Morocco: 'المغرب', c_Algeria: 'الجزائر', c_Iraq: 'العراق', c_Qatar: 'قطر',
    'c_United States': 'أمريكا', c_Germany: 'ألمانيا', 'c_United Kingdom': 'بريطانيا', c_France: 'فرنسا', c_Turkey: 'تركيا', c_Unknown: 'غير معروف', 'c_Local/Private': 'محلي',
  },
};

let LANG = localStorage.getItem('naz_lang') || null;

function t(key) {
  const d = I18N[LANG] || I18N.ar;
  return d[key] ?? I18N.ar[key] ?? key;
}
function genreName(id) { return t('g' + id) !== ('g' + id) ? t('g' + id) : String(id); }
function countryName(c) { return I18N[LANG]['c_' + c] || c; }

function applyDir() {
  document.documentElement.lang = LANG;
  document.documentElement.dir = I18N[LANG].dir;
}
function translateStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  const lb = root.getElementById ? root.getElementById('langBtn') : null;
  if (lb) lb.textContent = t('lang_btn');
}
async function initLang() {
  try {
    const cfg = await (await fetch('/api/config')).json();
    window.NAZ_CFG = cfg;
    if (!LANG) LANG = cfg.default_lang === 'en' ? 'en' : 'ar';
  } catch { if (!LANG) LANG = 'ar'; }
  applyDir();
}
function toggleLang() {
  LANG = LANG === 'ar' ? 'en' : 'ar';
  localStorage.setItem('naz_lang', LANG);
  applyDir();
}

function fmtNum(n) {
  n = +n || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

// ---- v2: simplified admin keys ----
Object.assign(I18N.en, {
  add_movie: '+ Add Movie', add_series: '+ Add Series',
  watch_servers: 'Watch Servers', dl_servers: 'Download Servers', primary: 'Default',
  country_f: 'Country / Language', no_content: 'No titles yet — add your first one!',
  ad_banners: 'Banner Ads', ad_pop: 'Popunder Ad', ad_player: 'Player Bar Ad',
  ad_position: 'Placement', pos_top: 'Top of page', pos_bottom: 'Bottom of page',
  pos_above: 'Above the player', pos_below: 'Below the player',
  pop_freq: 'Show once per user every (hours)',
  mode_text: 'Text link', mode_code: 'Ad code (HTML)', ad_text: 'Ad text', ad_link: 'Link URL (optional)',
  add_banner: '+ Add Banner', on: 'On', off: 'Off',
  save_content_hint: 'Saved instantly — appears on the site immediately.',
});
Object.assign(I18N.ar, {
  add_movie: '＋ إضافة فيلم', add_series: '＋ إضافة مسلسل',
  watch_servers: 'سيرفرات المشاهدة', dl_servers: 'سيرفرات التحميل', primary: 'الافتراضي',
  country_f: 'الدولة / اللغة', no_content: 'لا يوجد محتوى بعد — أضف أول عمل!',
  ad_banners: 'إعلانات البنر', ad_pop: 'الإعلان المنبثق (Popunder)', ad_player: 'إعلان شريط المشغل',
  ad_position: 'مكان الإعلان', pos_top: 'أعلى الصفحة', pos_bottom: 'أسفل الصفحة',
  pos_above: 'أعلى المشغل', pos_below: 'أسفل المشغل',
  pop_freq: 'يظهر للزائر مرة كل (ساعات)',
  mode_text: 'نص إعلاني', mode_code: 'كود إعلاني (HTML)', ad_text: 'نص الإعلان', ad_link: 'رابط الإعلان (اختياري)',
  add_banner: '＋ إضافة بنر', on: 'تشغيل', off: 'إيقاف',
  save_content_hint: 'يُحفظ فوراً ويظهر في الموقع مباشرة.',
});

// ---- v3: /adminjo + app button ----
Object.assign(I18N.en, {
  enter: 'Enter', app_section: 'Site App',
  app_hint: 'A floating download button appears on every page of the site. Set the link and text here — changes apply instantly.',
  app_show: 'Show download button on the site',
  app_url: 'App download URL', app_text: 'Button text',
});
Object.assign(I18N.ar, {
  enter: 'دخول', app_section: 'تطبيق الموقع',
  app_hint: 'يظهر زر تحميل عائم في كل صفحات الموقع. ضع الرابط ونص الزر هنا — وأي تعديل ينعكس فوراً.',
  app_show: 'عرض زر التحميل في الموقع',
  app_url: 'رابط تحميل التطبيق', app_text: 'نص الزر',
});

// ---- v4: site customization ----
Object.assign(I18N.en, {
  terms: 'Terms', privacy: 'Privacy', keywords_l: 'Keywords',
  cust_section: 'Customize', logo_f: 'Logo image URL (optional — default logo used if empty)',
  footer_text_f: 'Footer text', page_terms_f: 'Terms & Conditions page (HTML allowed)',
  page_priv_f: 'Privacy Policy page (HTML allowed)',
  seo_desc_f: 'SEO meta description', seo_kw_f: 'SEO keywords (comma separated)',
  view_page: 'View page ↗', cust_hint: 'Everything updates on the site instantly after saving.',
});
Object.assign(I18N.ar, {
  terms: 'الشروط والأحكام', privacy: 'الخصوصية', keywords_l: 'الكلمات المفتاحية',
  cust_section: 'التخصيص', logo_f: 'رابط صورة الشعار (اختياري — يُستخدم الشعار الافتراضي إذا تُرك فارغاً)',
  footer_text_f: 'نص أسفل الموقع', page_terms_f: 'صفحة الشروط والأحكام (يمكن استخدام HTML)',
  page_priv_f: 'صفحة سياسة الخصوصية (يمكن استخدام HTML)',
  seo_desc_f: 'وصف الموقع لمحركات البحث (Meta Description)', seo_kw_f: 'الكلمات المفتاحية SEO (افصل بينها بفاصلة)',
  view_page: 'عرض الصفحة ↗', cust_hint: 'كل التعديلات تظهر على الموقع فور الحفظ.',
});
