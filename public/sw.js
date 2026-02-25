const CACHE_NAME = 'dreambreeze-v1';
const AUDIO_CACHE = 'dreambreeze-audio-v1';

const AUDIO_ASSETS = [
  '/audio/rain-loop.mp3',
  '/audio/ocean-loop.mp3',
  '/audio/forest-loop.mp3',
];

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_NAME && key !== AUDIO_CACHE; })
          .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Audio files: cache-first
  var isAudio = AUDIO_ASSETS.some(function(a) { return url.pathname === a; });
  if (isAudio) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(function(cache) {
        return cache.match(event.request).then(function(cached) {
          if (cached) return cached;
          return fetch(event.request).then(function(response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Navigation: network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
  }
});
