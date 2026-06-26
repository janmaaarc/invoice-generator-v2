export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '/icon.png', tag: 'recurring-invoice' })
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    // Request periodic background sync if supported (Chrome Android)
    if ('periodicSync' in reg) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName })
      if (status.state === 'granted') {
        await (reg as unknown as { periodicSync: { register: (tag: string, opts: object) => Promise<void> } })
          .periodicSync.register('recurring-invoice-check', { minInterval: 24 * 60 * 60 * 1000 })
      }
    }
  } catch {
    // SW registration failed silently
  }
}

export async function cacheRecurringSchedule(dates: { name: string; nextDate: string }[]) {
  if (!('caches' in window)) return
  try {
    const cache = await caches.open('invoice-recurring-v1')
    await cache.put('/recurring-schedule', new Response(JSON.stringify(dates), {
      headers: { 'Content-Type': 'application/json' }
    }))
  } catch {
    // ignore
  }
}
