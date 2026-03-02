// Service Worker for Tomorrow.AI
// 用于缓存静态资源，提升加载速度

const CACHE_NAME = 'tomorrow-ai-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/logo.jpg'
];

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.error('[SW] Failed to cache static assets:', err);
    })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过API请求（不缓存动态数据）
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 跳过WebSocket
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // 缓存策略：Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 如果有缓存，先返回缓存
      const fetchPromise = fetch(request).then((networkResponse) => {
        // 网络请求成功，更新缓存
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.log('[SW] Network request failed:', err);
        // 网络请求失败，返回缓存（如果有）
        return cachedResponse;
      });

      // 如果有缓存，先返回缓存，同时在后台更新
      if (cachedResponse) {
        return cachedResponse;
      }

      // 没有缓存，等待网络请求
      return fetchPromise;
    })
  );
});

// 后台同步（可选）
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
  }
});

// 推送通知（可选）
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo.jpg',
      badge: '/logo.jpg'
    });
  }
});
