// Service Worker لحلبة الأسئلة — يتيح التثبيت كتطبيق (PWA) ويخزّن الأصول الثابتة
// (الواجهة، الأيقونات، الأصوات) للوصول السريع دون اتصال. لا يوفّر لعبًا كاملًا
// دون اتصال لأن منطق اللعبة يُدار من الخادم عمدًا لمنع الغش.

const CACHE_VERSION = 'v1';
const CACHE_NAME = `quiz-arena-${CACHE_VERSION}`;

const PRECACHE_URLS = ['/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isStaticAsset = (url) =>
  url.pathname.startsWith('/_next/static/') ||
  url.pathname.startsWith('/icons/') ||
  url.pathname.startsWith('/sounds/') ||
  url.pathname.startsWith('/images/') ||
  url.pathname === '/manifest.webmanifest';

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // لا تتدخل أبدًا في طلبات API — يجب أن تصل الشبكة دائمًا لضمان صحة حالة اللعبة
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
  }
});
