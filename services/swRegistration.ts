// Service Worker 注册和管理

const SW_PATH = '/sw.js';

/**
 * 注册Service Worker
 */
export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(SW_PATH);
      console.log('[SW] Service Worker registered:', registration);

      // 监听Service Worker状态变化
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 有新版本可用
              console.log('[SW] New version available');
              // 可以在这里提示用户刷新页面
              showUpdateNotification();
            }
          });
        }
      });
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  } else {
    console.log('[SW] Service Worker not supported');
  }
}

/**
 * 注销Service Worker
 */
export async function unregisterServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    console.log('[SW] Service Worker unregistered:', result);
  }
}

/**
 * 检查更新
 */
export async function checkForUpdates(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('[SW] Checked for updates');
  }
}

/**
 * 显示更新通知
 */
function showUpdateNotification(): void {
  // 可以在这里显示一个toast通知，提示用户刷新页面
  console.log('[SW] Please refresh the page to update');
}

/**
 * 预缓存关键资源
 */
export async function precacheResources(urls: string[]): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    // 发送消息给Service Worker预缓存资源
    registration.active?.postMessage({
      type: 'PRECACHE',
      urls
    });
  }
}
