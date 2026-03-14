self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: '/badge.png',
      vibrate: [200, 100, 200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        soundUrl: data.soundUrl
      }
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          // Signal to page to play the audio
          client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND' })
          return
        }
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})

// When notification is shown, send message to all open clients to play audio
self.addEventListener('push', function handler(event) {
  // This second handler broadcasts to open windows to play sound
  if (event.data) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
        for (const client of clientList) {
          client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND' })
        }
      })
    )
  }
}, { once: false })

