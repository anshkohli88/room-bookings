// sw.js — Service Worker for Room Bookings PWA
const CACHE_NAME = 'room-bookings-v1';

// App shell files to cache for offline loading
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/model.js',
  './js/auth.js',
  './js/api.js',
  './js/ui.js',
  './js/screens/login.js',
  './js/screens/home.js',
  './js/screens/room.js',
  './js/screens/booking.js',
  './config.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for APIs, cache-first for app shell
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go live for Google APIs and fonts (never cache these)
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('gstatic.com')
  ) {
    return; // Let browser handle normally
  }

  // Cache-first for app shell
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
