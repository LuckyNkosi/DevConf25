// Background Fetch API Demo - service-worker.js

const FETCH_ID_SW = 'my-background-fetch'; // Should match FETCH_ID in demo.js

self.addEventListener('install', (event) => {
    console.log('Service Worker: Install event');
    event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activate event');
    event.waitUntil(self.clients.claim()); // Become available to all pages
});

self.addEventListener('backgroundfetchsuccess', (event) => {
    console.log('Service Worker: backgroundfetchsuccess event', event.registration);
    const bgFetch = event.registration;

    event.waitUntil(async () => {
        try {
            // The records are now available.
            // You could open a Cache and store responses, or send them to the client.
            const records = await bgFetch.matchAll();
            console.log(`Service Worker: Background fetch '${bgFetch.id}' successful. Records:`, records);

            // Example: Storing in Cache API (optional, adapt as needed)
            const cache = await caches.open(bgFetch.id);
            for (const record of records) {
                if (record.response && record.response.ok) {
                    await cache.put(record.request, record.response.clone());
                }
            }
            console.log(`Service Worker: Responses for '${bgFetch.id}' stored in cache.`);


            // Notify the client page(s) that the fetch is complete and records are available.
            const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
            for (const client of clients) {
                client.postMessage({
                    type: 'FETCH_COMPLETE',
                    id: bgFetch.id,
                    // title: bgFetch.title // if you want to pass more info
                });
            }

            // Update the fetch registration's UI title and icon (optional)
            // This is useful if the download completes while the app isn't open.
            // The browser might show a notification.
            await event.updateUI({ title: `${bgFetch.title} - Download Complete!` });
            console.log(`Service Worker: UI updated for '${bgFetch.id}'.`);

        } catch (err) {
            console.error('Service Worker: Error processing backgroundfetchsuccess:', err);
            await event.updateUI({ title: `${bgFetch.title} - Processing Failed` });
        }
    });
});

self.addEventListener('backgroundfetchfail', (event) => {
    console.error('Service Worker: backgroundfetchfail event', event.registration);
    const bgFetch = event.registration;
    console.error(`Service Worker: Background fetch '${bgFetch.id}' failed. Reason: ${bgFetch.failureReason}`);

    event.waitUntil(async () => {
        // Notify client pages about the failure
        const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        for (const client of clients) {
            client.postMessage({
                type: 'FETCH_FAILED',
                id: bgFetch.id,
                failureReason: bgFetch.failureReason
            });
        }
        await event.updateUI({ title: `${bgFetch.title} - Download Failed` });
    });
});

self.addEventListener('backgroundfetchabort', (event) => {
    console.log('Service Worker: backgroundfetchabort event', event.registration);
    const bgFetch = event.registration;
    console.log(`Service Worker: Background fetch '${bgFetch.id}' aborted by user or script.`);

    event.waitUntil(async () => {
        // Notify client pages about the abort
        const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        for (const client of clients) {
            client.postMessage({
                type: 'FETCH_ABORTED',
                id: bgFetch.id
            });
        }
        // Optionally update UI, though abort often means user doesn't want further notifications.
        // await event.updateUI({ title: `${bgFetch.title} - Download Aborted` });
    });
});

// Optional: Handle clicks on the notification created by Background Fetch
self.addEventListener('backgroundfetchclick', (event) => {
    console.log('Service Worker: backgroundfetchclick event', event.registration);
    const bgFetch = event.registration;

    event.waitUntil(async () => {
        // Example: Open the client page when the notification is clicked.
        // Replace '/background-fetch-api/' with the actual path to your demo page.
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        if (clients && clients.length) {
            // If a client is already open, focus it.
            await clients[0].focus();
            // You might also want to send a message to the client to update its UI or navigate.
            clients[0].postMessage({ type: 'FETCH_CLICKED', id: bgFetch.id });
        } else {
            // If no client is open, open a new one.
            self.clients.openWindow('/background-fetch-api/'); // Adjust path as needed
        }
    });
});

console.log('Service Worker: Loaded and listening for Background Fetch events.');