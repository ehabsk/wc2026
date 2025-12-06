// 📦 اسم الملف: sw.js
const CACHE_NAME = 'wc2026-v1.3';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 🛠️ عند التثبيت: تخزين الملفات الأساسية
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache)
          .catch(err => console.warn('[SW] Partial cache failure:', err));
      })
      .then(() => self.skipWaiting()) // تفعيل فوري بعد التحديث
  );
});

// 🌐 عند الطلب: استراتيجية Network-first مع fallback للكاش
self.addEventListener('fetch', event => {
  // لا نتعامل مع طلبات غير HTTP (مثل chrome-extension://)
  if (event.request.url.startsWith('http') === false) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // تحديث الكاش تلقائيًا عند وجود اتصال
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // إذا فشل الطلب (لا إنترنت)، نعود للكاش
        return caches.match(event.request)
          .then(response => response || caches.match('./index.html'));
      })
  );
});

// ♻️ عند التفعيل: حذف الكاشات القديمة
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // اكتساب جميع التبويبات فورًا
  );
});
