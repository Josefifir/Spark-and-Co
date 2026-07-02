// Strike & Co. — Service Worker
// Based on PWABuilder "Offline copy of pages + offline fallback" template
// Strategy: StaleWhileRevalidate for all pages, offline.html as fallback

const CACHE = "strike-v5";
const offlineFallbackPage = "/offline.html";

importScripts("https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js");

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", async (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(offlineFallbackPage))
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Cache all visited pages (stale-while-revalidate)
workbox.routing.registerRoute(
  new RegExp("/*"),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE,
  })
);

// Navigation: try preload → network → offline fallback
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResp = await event.preloadResponse;
          if (preloadResp) return preloadResp;

          return await fetch(event.request);
        } catch {
          const cache = await caches.open(CACHE);
          return await cache.match(offlineFallbackPage);
        }
      })()
    );
  }
});

// ── Background Sync ────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "strike-sync") {
    event.waitUntil(replayQueuedRequests());
  }
});

async function replayQueuedRequests() {
  try {
    const db = await openQueue();
    const tx = db.transaction("requests", "readwrite");
    const store = tx.objectStore("requests");
    const all = await idbGetAll(store);
    for (const item of all) {
      try {
        await fetch(item.url, { method: item.method, headers: item.headers, body: item.body });
        await idbDelete(store, item.id);
      } catch {
        // retry next sync
      }
    }
  } catch { /* IndexedDB unavailable */ }
}

// ── Periodic Background Sync ───────────────────────────────────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "strike-refresh") {
    event.waitUntil(
      caches.open(CACHE).then((cache) =>
        Promise.allSettled(
          ["/", "/products", "/cart", offlineFallbackPage].map((url) =>
            fetch(url).then((res) => { if (res.ok) cache.put(url, res); })
          )
        )
      )
    );
  }
});

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Strike & Co.", body: "You have a new update.", icon: "/icons/icon-192.png" };
  try { data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "strike-notification",
      renotify: true,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url === target && "focus" in c);
        if (existing) return existing.focus();
        return self.clients.openWindow(target);
      })
  );
});

// ── IndexedDB helpers ──────────────────────────────────────────────────────
function openQueue() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("strike-queue", 1);
    req.onupgradeneeded = (e) =>
      e.target.result.createObjectStore("requests", { keyPath: "id", autoIncrement: true });
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}
function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}
function idbDelete(store, id) {
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = resolve;
    req.onerror = reject;
  });
}
