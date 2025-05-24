// Background Fetch API Demo - client-side script (demo.js)

const btnStartFetch = document.getElementById('btnStartFetch');
const btnAbortFetch = document.getElementById('btnAbortFetch');
const fetchProgress = document.getElementById('fetchProgress');
const statusMessages = document.getElementById('statusMessages');
const downloadedContentPreview = document.getElementById('downloadedContentPreview');
const contentPreview = document.getElementById('contentPreview');

const FETCH_ID = 'my-background-fetch';
// Replace with a URL to a large file for a more realistic demo.
// For this example, we'll use a placeholder.
// IMPORTANT: For a real demo, use a file that is appropriately sized and CORS-enabled if from a different origin.
// You might need to host a sample file yourself.
const FILE_TO_DOWNLOAD_URL = 'https://jsonplaceholder.typicode.com/photos'; // Example large JSON
const FILE_ID = 'downloaded-photos.json';

function logStatus(message) {
    console.log(message);
    statusMessages.innerHTML = message; // Use innerHTML if you want to include HTML like <br>
}

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            logStatus('Service Worker registered successfully.');
            console.log('Service Worker registration:', registration);
            return registration;
        } catch (error) {
            logStatus(`Service Worker registration failed: ${error}`);
            console.error('Service Worker registration error:', error);
            return null;
        }
    } else {
        logStatus('Service Workers are not supported in this browser.');
        return null;
    }
}

btnStartFetch.addEventListener('click', async () => {
    logStatus('Starting background fetch...');
    downloadedContentPreview.style.display = 'none'; // Hide previous preview

    const swRegistration = await navigator.serviceWorker.ready; // Ensure SW is active
    if (!swRegistration || !swRegistration.active) {
        logStatus('Service worker not active. Cannot start background fetch.');
        return;
    }

    if (!('BackgroundFetchManager' in swRegistration)) {
        logStatus('Background Fetch API is not supported in this browser or service worker.');
        return;
    }

    try {
        // Check for existing fetches
        const existingFetch = await swRegistration.backgroundFetch.get(FETCH_ID);
        if (existingFetch) {
            logStatus(`A background fetch with ID '${FETCH_ID}' already exists. Attaching to it.`);
            attachToFetch(existingFetch);
            return;
        }

        logStatus(`Requesting download of: ${FILE_TO_DOWNLOAD_URL}`);
        const bgFetch = await swRegistration.backgroundFetch.fetch(FETCH_ID, [FILE_TO_DOWNLOAD_URL], {
            title: 'My Large File Download',
            icons: [{ // Provide appropriate icons for notifications
                sizes: '192x192',
                src: 'icon-192.png', // You'll need to create this icon
                type: 'image/png',
            }],
            downloadTotal: 0, // Set to 0 if unknown, or estimated size in bytes
        });
        logStatus(`Background fetch registered with ID: ${bgFetch.id}`);
        attachToFetch(bgFetch);

    } catch (err) {
        logStatus(`Error starting background fetch: ${err.name} - ${err.message}`);
        console.error(err);
    }
});

function attachToFetch(bgFetchRegistration) {
    logStatus(`Attached to fetch: ${bgFetchRegistration.id}. Current state: ${bgFetchRegistration.result}`);
    btnStartFetch.disabled = true;
    btnAbortFetch.disabled = false;

    updateProgressUI(bgFetchRegistration);

    bgFetchRegistration.addEventListener('progress', () => {
        updateProgressUI(bgFetchRegistration);
    });

    // Listen for messages from the service worker about completion
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'FETCH_COMPLETE' && event.data.id === FETCH_ID) {
            logStatus(`Service worker reported fetch complete for ${FETCH_ID}. Records available.`);
            showDownloadedContent(bgFetchRegistration);
            btnStartFetch.disabled = false;
            btnAbortFetch.disabled = true;
        }
         if (event.data && event.data.type === 'FETCH_ABORTED' && event.data.id === FETCH_ID) {
            logStatus(`Service worker reported fetch aborted for ${FETCH_ID}.`);
            fetchProgress.value = 0;
            btnStartFetch.disabled = false;
            btnAbortFetch.disabled = true;
        }
    });
}


function updateProgressUI(bgFetchRegistration) {
    if (!bgFetchRegistration) return;

    const downloaded = bgFetchRegistration.downloaded;
    const total = bgFetchRegistration.downloadTotal;

    if (total > 0) {
        const percent = Math.round((downloaded / total) * 100);
        fetchProgress.value = percent;
        logStatus(`Download progress: ${percent}% (${downloaded} / ${total} bytes)`);
    } else {
        // Total size unknown, show indeterminate progress or just bytes downloaded
        fetchProgress.removeAttribute('value'); // Indeterminate
        logStatus(`Download progress: ${downloaded} bytes downloaded (total size unknown)`);
    }

    if (bgFetchRegistration.result === 'success') {
        logStatus('Download finished successfully (client-side check).');
        fetchProgress.value = 100;
        // The 'backgroundfetchsuccess' event in SW is more reliable for completion.
    } else if (bgFetchRegistration.result === 'failure') {
        logStatus('Download failed (client-side check).');
        btnStartFetch.disabled = false;
        btnAbortFetch.disabled = true;
    }
}


btnAbortFetch.addEventListener('click', async () => {
    const swRegistration = await navigator.serviceWorker.ready;
    if (!swRegistration || !('BackgroundFetchManager' in swRegistration)) {
        logStatus('Background Fetch API not available to abort.');
        return;
    }
    try {
        const bgFetch = await swRegistration.backgroundFetch.get(FETCH_ID);
        if (bgFetch) {
            logStatus(`Aborting background fetch: ${bgFetch.id}`);
            await bgFetch.abort();
            logStatus(`Background fetch ${bgFetch.id} aborted.`);
            // UI update will happen via 'FETCH_ABORTED' message from SW or if page reloads.
        } else {
            logStatus('No active fetch to abort.');
        }
    } catch (err) {
        logStatus(`Error aborting background fetch: ${err.message}`);
        console.error(err);
    }
    btnStartFetch.disabled = false;
    btnAbortFetch.disabled = true;
    fetchProgress.value = 0;
});

async function showDownloadedContent(bgFetchRegistration) {
    logStatus('Attempting to retrieve downloaded content...');
    try {
        const records = await bgFetchRegistration.matchAll();
        if (!records || records.length === 0) {
            logStatus('No records found for this background fetch.');
            return;
        }

        const firstRecord = records[0]; // Assuming one file for this demo
        if (firstRecord.response) {
            const response = firstRecord.response;
            if (response.ok) {
                const blob = await response.blob();
                logStatus(`Content retrieved. Blob type: ${blob.type}, size: ${blob.size} bytes.`);

                // For demonstration, try to read as text if it's likely text-based
                // Adjust based on the actual file type you are downloading
                if (blob.type.includes('json') || blob.type.includes('text')) {
                    const text = await blob.text();
                    contentPreview.textContent = text.substring(0, 1000) + (text.length > 1000 ? '\n...' : ''); // Preview first 1000 chars
                    downloadedContentPreview.style.display = 'block';
                } else {
                    contentPreview.textContent = `Cannot display preview for blob type: ${blob.type}. File is available.`;
                    downloadedContentPreview.style.display = 'block';
                }
                // In a real app, you'd save this blob to IndexedDB, Cache API, or offer for download.
                // e.g., const url = URL.createObjectURL(blob);
                // const a = document.createElement('a');
                // a.href = url;
                // a.download = FILE_ID;
                // document.body.appendChild(a);
                // a.click();
                // window.URL.revokeObjectURL(url);
                // a.remove();

            } else {
                logStatus(`Failed to get response: ${response.status} ${response.statusText}`);
            }
        } else {
            logStatus('Response not available in the record.');
        }
    } catch (error) {
        logStatus(`Error accessing downloaded content: ${error}`);
        console.error(error);
    }
}


// Initial setup
async function init() {
    const registration = await registerServiceWorker();
    if (registration && registration.active) {
        // Check for an active fetch when the page loads
        const swRegistration = await navigator.serviceWorker.ready;
        const bgFetch = await swRegistration.backgroundFetch.get(FETCH_ID);
        if (bgFetch) {
            logStatus(`Found an ongoing or completed background fetch: ${bgFetch.id}. Attaching...`);
            attachToFetch(bgFetch);
             // If already completed, try to show content
            if (bgFetch.result === 'success' && bgFetch.recordsAvailable) {
                 setTimeout(() => showDownloadedContent(bgFetch), 1000); // give SW time to message if it hasn't
            }
        } else {
            logStatus('Ready to start a new background fetch.');
        }
    }
}

// You'll also need an icon for the notification, e.g., 'icon-192.png' in the same directory.
// Create a simple 192x192px PNG file.

init();