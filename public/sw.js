self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('periodicsync', event => {
  if (event.tag === 'recurring-invoice-check') {
    event.waitUntil(handleRecurringCheck());
  }
});

async function handleRecurringCheck() {
  const allClients = await self.clients.matchAll({ type: 'window' });
  if (allClients.length > 0) {
    allClients.forEach(client => client.postMessage({ type: 'CHECK_RECURRING' }));
    return;
  }
  // Page closed — read schedule from cache
  const cache = await caches.open('invoice-recurring-v1');
  const resp = await cache.match('/recurring-schedule');
  if (!resp) return;
  const schedules = await resp.json();
  const today = new Date().toISOString().split('T')[0];
  const due = schedules.filter(s => s.nextDate <= today);
  if (due.length === 0) return;
  const names = due.map(s => String(s.name || '').replace(/[^\w\s,.-]/g, '').trim().slice(0, 50)).filter(Boolean).join(', ');
  await self.registration.showNotification('Recurring Invoice Due', {
    body: `${names} - open the app to generate`,
    icon: '/icon.png',
    tag: 'recurring-invoice',
    data: { url: '/' },
  });
}

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow(event.notification.data?.url || '/');
    })
  );
});
