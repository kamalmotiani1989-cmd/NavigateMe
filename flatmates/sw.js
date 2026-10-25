// Offline support for the installed app. Network first, so every change we
// deploy shows up on the next open; the cache is only a fallback offline.
const CACHE = "fm-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Only same-origin GETs; Supabase, Razorpay and photos go straight to the network.
  if(e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});

// Tapping a notification opens (or focuses) the app on the right screen.
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = "./#" + ((e.notification.data && e.notification.data.open) || "requests");
  e.waitUntil(self.clients.matchAll({ type:"window", includeUncontrolled:true }).then(list => {
    for(const c of list){ if("focus" in c){ c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
