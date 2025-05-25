// Web Share API Level 2 - File Share Demo (demo.js)

const btnShareFile = document.getElementById('btnShareFile');
const btnPickFileToShare = document.getElementById('btnPickFileToShare');
const btnSharePickedFile = document.getElementById('btnSharePickedFile');
const filePicker = document.getElementById('filePicker');
const statusMessages = document.getElementById('statusMessages');

const DEMO_FILENAME = 'demo-file.txt';
const DEMO_FILE_CONTENT = 'Hello from the Web Share API Level 2 demo!';
const DEMO_FILE_TYPE = 'text/plain';

let pickedFile = null;
function logStatus(message, isError = false) {
    console.log(message);
    statusMessages.textContent = message;
    statusMessages.style.color = isError ? 'red' : 'black';
}

// Create a dummy file object for sharing
const demoFile = new File([DEMO_FILE_CONTENT], DEMO_FILENAME, { type: DEMO_FILE_TYPE });

// Check if Web Share API is supported
if (navigator.share && navigator.canShare) {
    logStatus('Web Share API is supported.');
} else {
    logStatus('Web Share API is not supported in this browser.', true);
    btnShareFile.disabled = true;
    btnSharePickedFile.disabled = true;
}

btnShareFile.addEventListener('click', async () => {
    const filesArray = pickedFile ? [pickedFile] : [demoFile];
    const filedName = pickedFile ? pickedFile.name : DEMO_FILENAME;
    const shareData = {
        title: 'Share Demo File',
        text: `Check out this file: ${filedName}`,
        files: filesArray,
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
        logStatus(`Attempting to share "${DEMO_FILENAME}"...`);
        try {
            await navigator.share(shareData);
            logStatus(`"${filedName}" shared successfully or share dialog opened.`);
        } catch (err) {
            logStatus(`Error sharing file: ${err.name} - ${err.message}`, true);
            console.error('Share error:', err);
            if (err.name === 'AbortError') {
                logStatus('Share aborted by the user.', false);
            }
        }
    } else {
        logStatus('Sharing these files is not supported by the browser/OS or data is invalid.', true);
        // Log details for debugging if canShare fails
        console.warn('navigator.canShare returned false. Share data:', shareData);
        if (!navigator.canShare({files: filesArray})) {
            console.warn('navigator.canShare({files: filesArray}) is false. Files might be too large, wrong type, or too many files.');
        }
    }
});

btnPickFileToShare.addEventListener('click', () => {
    filePicker.click(); // Open file picker
});

filePicker.addEventListener('change', async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
        logStatus('No file selected.');
        return;
    }
    const fileToShare = files[0];
    pickedFile = fileToShare; // Store the selected file for sharing later
    logStatus(`File selected: ${fileToShare.name}`);

    // Reset file picker for next selection
    filePicker.value = '';
});

//share the picked file
btnSharePickedFile.addEventListener('click', async () => {
    if (!pickedFile) {
        logStatus('No file selected to share.', true);
        return;
    }

    const shareData = {
        title: `Share ${pickedFile.name}`,
        text: `Check out this file: ${pickedFile.name}`,
        files: [pickedFile],
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
        logStatus(`Attempting to share "${pickedFile.name}"...`);
        try {
            await navigator.share(shareData);
            logStatus(`"${pickedFile.name}" shared successfully or share dialog opened.`);
        } catch (err) {
            logStatus(`Error sharing file: ${err.name} - ${err.message}`, true);
            console.error('Share error:', err);
            if (err.name === 'AbortError') {
                logStatus('Share aborted by the user.', false);
            }
        }
    } else {
        logStatus('Sharing this file is not supported by the browser/OS or data is invalid.', true);
        console.warn('navigator.canShare returned false. Share data:', shareData);
    }
});

// Initial check for file sharing capability
if (navigator.canShare && !navigator.canShare({ files: [demoFile] })) {
    logStatus('Sharing files is generally not supported or this specific dummy file cannot be shared.', true);
    // btnShareFile.disabled = true; // Optionally disable if even the dummy file can't be shared
} else if (navigator.share) {
     logStatus('Ready to share files. Click a button to start.');
}