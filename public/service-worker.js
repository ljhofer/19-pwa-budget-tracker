// Cache that holds data when app is offline
const CACHE_NAME = "my-site-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

// An array of all urls that the PWA should cache.
const urlsToCache = [
  "/",
  "/db.js",
  "/index.js",
  "/manifest.json",
  "/styles.css",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

// Runs when the user has chosen to install the web app on their machine as a standalone PWA
self.addEventListener("install", function(event) {
  // Performs install steps
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Tells the service worker to listen for any events where a fetch (api call) is being made 
self.addEventListener("fetch", function(event) {
  // Intercept api fetch routes
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {

        // Attempts to perform the fetch normally, in other words, if there is still an Internet connection
        return fetch(event.request)
          .then(response => {
            // If the response is good, stores in the cache the name of the route that was accessed, and the data that was sent back.
            
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }

            return response;
          })

          // Runs if the fetch fails; ie: there is no Internet connection. In this case it pulls the correct saved data from the cache and sends it back instead.
          .catch(err => {
            // If network request failed, tries to get it from the cache
            return cache.match(event.request);
          });
      }).catch(err => console.log(err))
    );

    return;
  }

  // Handles all home page calls. 
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request).then(function(response) {
        if (response) {
          return response;
        } else if (event.request.headers.get("accept").includes("text/html")) {
          // Returns the cached home page for all requests for html pages
          return caches.match("/");
        }
      });
    })
  );
});
