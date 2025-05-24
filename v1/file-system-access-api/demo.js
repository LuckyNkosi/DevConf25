// File System Access API Demo

const btnOpenFile = document.getElementById('btnOpenFile');
const btnSaveFile = document.getElementById('btnSaveFile');
const btnSaveAsFile = document.getElementById('btnSaveAsFile');
const fileContentTextArea = document.getElementById('fileContent');
const statusMessages = document.getElementById('statusMessages');

let currentFileHandle = null;

function logStatus(message) {
    console.log(message);
    statusMessages.textContent = message;
}

// 1. Open File Demo
btnOpenFile.addEventListener('click', async () => {
    logStatus('Attempting to open file...');
    try {
        // The showOpenFilePicker() method shows a file picker dialog.
        // It returns an array of FileSystemFileHandle objects.
        // We'll only handle the first file selected.
        const [fileHandle] = await window.showOpenFilePicker();
        currentFileHandle = fileHandle; // Store the handle for saving

        const file = await fileHandle.getFile();
        const contents = await file.text();
        fileContentTextArea.value = contents;
        logStatus(`File "${file.name}" opened successfully.`);
        btnSaveAsFile.disabled = false; // Enable "Save As"
    } catch (err) {
        if (err.name === 'AbortError') {
            logStatus('File open aborted by user.');
        } else {
            logStatus(`Error opening file: ${err.name} - ${err.message}`);
            console.error(err);
        }
    }
});

// 2. Save New File Demo (behaves like "Save As" initially)
btnSaveFile.addEventListener('click', async () => {
    logStatus('Attempting to save new file (Save As)...');
    try {
        // The showSaveFilePicker() method shows a file picker dialog.
        // It returns a FileSystemFileHandle object.
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: 'untitled.txt',
            types: [{
                description: 'Text Files',
                accept: { 'text/plain': ['.txt'] },
            }],
        });
        currentFileHandle = fileHandle; // Store the new handle

        const writable = await fileHandle.createWritable();
        await writable.write(fileContentTextArea.value);
        await writable.close();

        logStatus(`File "${fileHandle.name}" saved successfully.`);
        btnSaveAsFile.disabled = false; // Enable "Save As" as we now have a handle
    } catch (err) {
        if (err.name === 'AbortError') {
            logStatus('File save aborted by user.');
        } else {
            logStatus(`Error saving file: ${err.name} - ${err.message}`);
            console.error(err);
        }
    }
});

// 3. Save As File Demo (or Save to current file if handle exists)
btnSaveAsFile.addEventListener('click', async () => {
    if (!currentFileHandle) {
        logStatus('No file open to "Save As". Please open or save a new file first.');
        // Optionally, trigger btnSaveFile behavior if no handle
        // btnSaveFile.click();
        return;
    }

    logStatus(`Attempting to save to "${currentFileHandle.name}"...`);
    try {
        // Create a writable stream to the existing file handle.
        const writable = await currentFileHandle.createWritable();
        await writable.write(fileContentTextArea.value);
        await writable.close();
        logStatus(`File "${currentFileHandle.name}" saved successfully.`);
    } catch (err) {
        if (err.name === 'AbortError') {
            // This might happen if the user cancels a permission prompt (though less common for save)
            logStatus('File save aborted.');
        } else {
            logStatus(`Error saving file: ${err.name} - ${err.message}`);
            console.error(err);
            // If saving to an existing handle fails (e.g., permissions revoked),
            // you might want to re-prompt with showSaveFilePicker or clear currentFileHandle.
            // For this demo, we'll just log the error.
        }
    }
});

logStatus('File System Access API Demo loaded. Try opening or saving a file.');