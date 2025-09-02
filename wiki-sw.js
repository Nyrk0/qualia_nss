// Wiki Service Worker - Basic implementation
// Minimal service worker to avoid 404 errors

self.addEventListener('install', function(event) {
    console.log('📝 Wiki Service Worker installed');
});

self.addEventListener('activate', function(event) {
    console.log('📝 Wiki Service Worker activated');
});

self.addEventListener('fetch', function(event) {
    // Pass through all requests for now
    return;
});