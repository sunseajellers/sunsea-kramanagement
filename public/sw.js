self.addEventListener('install', (event) => {
    // Service worker installed
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Service worker activated
});

self.addEventListener('fetch', (event) => {
    // Simple pass-through fetch handler for now
    // In future, can cache static assets here
});
