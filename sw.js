// cache name
const cacheFile = 'restaurant-reviews-v1';

// define an array of assets to cache
const urlsToCache = [
    '/',
    '/index.html',
    'css/responsive.css',
    '/restaurant.html',
    '/restaurant.html?id=1',
    '/restaurant.html?id=2',
    '/restaurant.html?id=3',
    '/restaurant.html?id=4',
    '/restaurant.html?id=5',
    '/restaurant.html?id=6',
    '/restaurant.html?id=7',
    '/restaurant.html?id=8',
    '/restaurant.html?id=9',
    '/restaurant.html?id=10',
    'css/styles.css',
    'data/restaurants.json',
    'img/1.jpg',
    'img/2.jpg',
    'img/3.jpg',
    'img/4.jpg',
    'img/5.jpg',
    'img/6.jpg',
    'img/7.jpg',
    'img/8.jpg',
    'img/9.jpg',
    'img/10.jpg',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css'
];

// setup an event listener for the install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheFile).then(cache => {
            return cache.addAll(urlsToCache);
        }).catch(err => {
            console.log('Error from cache open:', err);
        })
    );
});

// setup an event listener so we can do some things when the new serviceWorker activates
self.addEventListener('activate', event => {
    event.waitUntil(

        // get all the cacheNames that exist
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('restaurant-reviews-') && cacheName != cacheFile;

                    // cacheNames = array of caches to delete
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

// Setup an eventlistener to intercept fetch events
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) { // if the data already exists in the cache
                return response;
            }

            // Fetch it from the network
            return fetch(event.request).then(response => {

                // It wasn't found in the cache, add it now
                return caches.open(cacheFile).then(cache => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            }).catch(err => {
                throw err; // network error
            });
        })
    );
});