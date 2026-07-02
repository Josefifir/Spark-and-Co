// Strike & Co. — Service Worker v3
// Strategies:
//   - Static shell assets (/_next/static/): Cache-first
//   - Navigation (HTML pages):             Network-first → cached → offline.html
//   - API routes (/api/*):                 Network-only
//   - Background Sync:                     Retry failed non-GET requests
//   - Periodic Sync:                       Refresh precache hourly
//   - Push Notifications:                  Show branded notification

const CACHE_NAME = "strike-v3";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = ["/", "/products", "/cart", OFFLINE_URL];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, and API requests
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // /_next/static/ — cache-first (hashed, immutable)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((c) => c.put(request, response.clone()));
            }
            return response;
          })
      )
    );
    return;
  }

  // Navigation — network-first, then cache, then offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Everything else — network-first, silent cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((c) => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── Background Sync ────────────────────────────────────────────────────────
// Queued POST requests (e.g. add-to-cart while offline) are retried here.
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
        // Will retry next sync
      }
    }
  } catch {
    // IndexedDB not available
  }
}

// ── Periodic Background Sync ───────────────────────────────────────────────
// Refreshes the precached shell pages in the background.
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "strike-refresh") {
    event.waitUntil(refreshPrecache());
  }
});

async function refreshPrecache() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(
    PRECACHE_URLS.map((url) =>
      fetch(url).then((res) => { if (res.ok) cache.put(url, res); })
    )
  );
}

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

// ── IndexedDB helpers (minimal) ────────────────────────────────────────────
function openQueue() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("strike-queue", 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore("requests", { keyPath: "id", autoIncrement: true });
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
