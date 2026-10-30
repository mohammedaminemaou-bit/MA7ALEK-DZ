/* MA7ALAK DZ — Service Worker
   غيّر رقم VERSION عند كل نشر جديد حتى تصل النسخة الجديدة للمستخدمين. */
const VERSION = 'v1';
const CACHE = 'ma7alak-' + VERSION;
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const CDN = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.1'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // كل ملف على حدة: غياب ملف لا يُفشل التثبيت
    await Promise.all(CORE.map(u => c.add(u).catch(() => {})));
    await Promise.all(CDN.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k.startsWith('ma7alak-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // لا نتدخل أبداً في الخادم (المزامنة، الدخول، الاشتراك)
  if (url.hostname.endsWith('supabase.co')) return;

  // صفحة التطبيق: الشبكة أولاً ثم النسخة المحفوظة عند انقطاع الإنترنت
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (r && r.ok) (await caches.open(CACHE)).put('index.html', r.clone());
        return r;
      } catch (_) {
        return (await caches.match('index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  // باقي الملفات (أيقونات، مكتبة Supabase، الخطوط): المحفوظ أولاً مع تحديث في الخلفية
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});
