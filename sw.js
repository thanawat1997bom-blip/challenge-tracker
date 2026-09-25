const CACHE_NAME = "challenge-tracker-v2";
const FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("script.google.com")) {
    return;
  }

  // หน้าเว็บหลัก (HTML): ดึงเวอร์ชันล่าสุดจากเน็ตก่อนเสมอ ถ้าออฟไลน์ค่อยใช้แคชสำรอง
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // ไฟล์อื่นๆ (ไอคอน, manifest): ใช้แคชก่อน เร็วกว่า
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
