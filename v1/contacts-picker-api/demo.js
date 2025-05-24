// Contacts Picker API Demo (demo.js)

const btnSelectContacts = document.getElementById('btnSelectContacts');
const statusMessages = document.getElementById('statusMessages');
const contactsListDiv = document.getElementById('contactsList');

function logStatus(message, isError = false) {
    console.log(message);
    statusMessages.textContent = message;
    statusMessages.style.color = isError ? 'red' : 'black';
}

// Check if Contacts Picker API is supported
if ('contacts' in navigator && 'ContactsManager' in window) {
    logStatus('Contacts Picker API is supported.');
} else {
    logStatus('Contacts Picker API is not supported in this browser. Ensure you are on HTTPS and using a compatible browser (e.g., Chrome for Android).', true);
    btnSelectContacts.disabled = true;
}

btnSelectContacts.addEventListener('click', async () => {
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
        logStatus('Contacts Picker API not available.', true);
        return;
    }

    // Define the properties you want to access.
    // Available properties: 'name', 'email', 'tel', 'address', 'icon'
    const properties = ['name', 'email', 'tel', 'icon'];
    // Set to true to allow multiple contact selection
    const options = { multiple: true };

    logStatus(`Requesting contacts with properties: ${properties.join(', ')} (multiple: ${options.multiple})...`);
    contactsListDiv.innerHTML = ''; // Clear previous results

    try {
        const contacts = await navigator.contacts.select(properties, options);

        if (contacts && contacts.length > 0) {
            logStatus(`Successfully selected ${contacts.length} contact(s).`);
            displayContacts(contacts);
        } else {
            logStatus('No contacts selected or selection was cancelled.');
        }
    } catch (err) {
        logStatus(`Error selecting contacts: ${err.name} - ${err.message}`, true);
        console.error('Contacts Picker error:', err);
        if (err.name === 'AbortError') {
            logStatus('Contact selection aborted by the user.', false);
        } else if (err.name === 'SecurityError') {
            logStatus('Contact selection failed due to a security error. Ensure the page is served over HTTPS and has user interaction.', true);
        }
    }
});

function displayContacts(contacts) {
    contactsListDiv.innerHTML = ''; // Clear previous entries

    contacts.forEach((contact, index) => {
        const contactDiv = document.createElement('div');
        contactDiv.style.border = '1px solid #eee';
        contactDiv.style.padding = '10px';
        contactDiv.style.marginBottom = '10px';

        let html = `<h3>Contact ${index + 1}</h3>`;

        if (contact.name && contact.name.length > 0) {
            html += `<p><strong>Name(s):</strong> ${contact.name.join(', ')}</p>`;
        }
        if (contact.email && contact.email.length > 0) {
            html += `<p><strong>Email(s):</strong> ${contact.email.join(', ')}</p>`;
        }
        if (contact.tel && contact.tel.length > 0) {
            html += `<p><strong>Phone(s):</strong> ${contact.tel.join(', ')}</p>`;
        }

        // Note: 'address' property requires careful handling as it's complex.
        // Example for address (if requested):
        // if (contact.address && contact.address.length > 0) {
        //     html += `<p><strong>Address(es):</strong></p><ul>`;
        //     contact.address.forEach(addr => {
        //         html += `<li>${JSON.stringify(addr, null, 2)}</li>`; // Display raw address object
        //     });
        //     html += `</ul>`;
        // }

        if (contact.icon && contact.icon.length > 0) {
            html += `<p><strong>Icon(s):</strong></p>`;
            contact.icon.forEach(iconBlob => {
                const imageUrl = URL.createObjectURL(iconBlob);
                html += `<img src="${imageUrl}" alt="Contact icon" style="max-width: 64px; max-height: 64px; margin-right: 5px;">`;
                // It's good practice to revoke object URLs when no longer needed,
                // but for simplicity in this demo, we're not tracking them to revoke.
            });
        }
        contactDiv.innerHTML = html;
        contactsListDiv.appendChild(contactDiv);
    });
}

logStatus('Ready to pick contacts. Ensure the page is served over HTTPS.');