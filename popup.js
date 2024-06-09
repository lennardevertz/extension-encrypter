document.addEventListener('DOMContentLoaded', function () {
  appendLog('DOM fully loaded and parsed');

  const storeKeyButton = document.getElementById('storeKey');
  const retrieveKeyButton = document.getElementById('retrieveKey');
  const clearSessionButton = document.getElementById('clearSession');
  const readKeyButton = document.getElementById('readKey');

  if (storeKeyButton) {
    storeKeyButton.addEventListener('click', async () => {
      appendLog('Store Key button clicked');
      try {
        const password = document.getElementById('password').value;
        const privateKey = "mySuperSecretPrivateKey"; // Example private key
        const encryptedKey = await encryptPrivateKey(privateKey, password);

        // Clear any existing session before storing a new key
        await clearSession();

        if (encryptedKey) {
          // Store encrypted key in local storage
          chrome.storage.local.set({ encryptedKey }, () => {
            appendLog('Encrypted key stored');
          });
        }
      } catch (error) {
        appendLog('Error storing key: ' + error.message);
      }
    });
  } else {
    appendLog('Store Key button not found');
  }

  if (retrieveKeyButton) {
    retrieveKeyButton.addEventListener('click', async () => {
      appendLog('Retrieve Key button clicked');
      try {
        const password = document.getElementById('password').value;
    
        // Retrieve encrypted key from local storage
        chrome.storage.local.get(['encryptedKey'], async (result) => {
          if (result.encryptedKey) {
            try {
              const decryptedKey = await decryptPrivateKey(result.encryptedKey, password);
              appendLog('Decrypted Key: ' + decryptedKey);
    
              if (decryptedKey) {
                // Generate a session key
                const sessionData = await generateSessionKey(password);
                const sessionKey = sessionData.key;
    
                // Encrypt the private key with the session key
                const encryptedSessionKey = await encryptWithSessionKey(decryptedKey, await importSessionKey(sessionKey, sessionData.salt));
    
                // Send session key and encrypted key to background script
                chrome.runtime.sendMessage({ type: "setSessionKey", sessionKey: sessionData, encryptedSessionKey }, (response) => {
                  if (response.status === "Error") {
                    appendLog('Error setting session key: ' + response.message);
                  } else {
                    appendLog(response.status);
                  }
                });
              }
            } catch (error) {
              appendLog('Error: Incorrect password, cannot decrypt the key. ' + error.message);
            }
          } else {
            appendLog('No encrypted key found in storage');
          }
        });
      } catch (error) {
        appendLog('Error retrieving key: ' + error.message);
      }
    });
    
  } else {
    appendLog('Retrieve Key button not found');
  }

  if (clearSessionButton) {
    clearSessionButton.addEventListener('click', () => {
      appendLog('Clear Session button clicked');
      clearSession().then(response => {
        appendLog(response.status);
      }).catch(error => {
        appendLog('Error clearing session: ' + error.message);
      });
    });
  } else {
    appendLog('Clear Session button not found');
  }

  if (readKeyButton) {
    readKeyButton.addEventListener('click', async () => {
      appendLog('Read Key button clicked');
      try {
        chrome.runtime.sendMessage({ type: "getDecryptedKey" }, async (response) => {
          if (response.encryptedSessionKey && response.sessionKey) {
            try {
              const sessionKey = await importSessionKey(response.sessionKey.key, response.sessionKey.salt);

              const decryptedKey = await decryptWithSessionKey(response.encryptedSessionKey, sessionKey);
              appendLog('Decrypted Key: ' + decryptedKey);
              // Clear the decrypted key from memory after use
            } catch (error) {
              appendLog('Error decrypting with session key: ' + error.message);
            }
          } else {
            appendLog('No valid session or decrypted key found');
          }
        });
      } catch (error) {
        appendLog('Error reading key: ' + error.message);
      }
    });
  } else {
    appendLog('Read Key button not found');
  }
});

async function clearSession() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "clearSessionKey" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

function appendLog(message) {
  const logsDiv = document.getElementById('logs');
  const logEntry = document.createElement('div');
  logEntry.textContent = message;
  logEntry.className = 'log-entry';
  logsDiv.appendChild(logEntry);
  logsDiv.scrollTop = logsDiv.scrollHeight; // Scroll to the bottom
}
