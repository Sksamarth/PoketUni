self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || '💰 Budget Tracker', {
      body: data.body || "Don't forget to log today's expenses!",
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'expense-reminder',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

// On install/activate just take over immediately
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
