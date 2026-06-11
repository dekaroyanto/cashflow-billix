// Public VAPID key dari environment
const PUBLIC_VAPID_KEY =
  "BMkouxGVeaDdi0ZD6NRychegdCpbd-c5iou8bENuFHLQ5nTGxj44hGZ9W9K5mpZIKxUO7D3I70WJ4WLP_MtD3PU";

// Listen for push notifications [citation:1]
self.addEventListener("push", function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const { title, body, type, url, badge } = data;

      const options = {
        body: body || "Ada transaksi baru",
        icon: "/icons/icon-192x192.png",
        badge: badge || "/icons/badge-72x72.png",
        vibrate: [100, 50, 100],
        data: {
          url: url || "/",
          dateOfArrival: Date.now(),
          type: type || "info",
        },
        actions: [
          {
            action: "view",
            title: "Lihat Detail",
          },
          {
            action: "close",
            title: "Tutup",
          },
        ],
      };

      event.waitUntil(
        self.registration.showNotification(title || "CashFlow Billix", options),
      );
    } catch (error) {
      // Handle plain text notification
      event.waitUntil(
        self.registration.showNotification("CashFlow Billix", {
          body: event.data.text(),
          icon: "/icons/icon-192x192.png",
        }),
      );
    }
  }
});

// Handle notification click [citation:1]
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // Jika sudah ada window yang terbuka, focus ke window tersebut
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        // Jika tidak ada, buka window baru
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Service worker installed
self.addEventListener("install", function (event) {
  console.log("Service Worker installed");
  self.skipWaiting();
});

// Service worker activated
self.addEventListener("activate", function (event) {
  console.log("Service Worker activated");
  event.waitUntil(clients.claim());
});
