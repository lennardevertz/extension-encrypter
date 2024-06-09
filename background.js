let sessionKey = null;
let encryptedSessionKey = null;
let sessionTimeout = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.type === "setSessionKey") {
      sessionKey = request.sessionKey;
      encryptedSessionKey = request.encryptedSessionKey;
      clearTimeout(sessionTimeout); // Clear any existing timeout
      sessionTimeout = setTimeout(() => {
        sessionKey = null;
        encryptedSessionKey = null;
        console.log("Session key and encrypted key cleared due to timeout");
      }, 600000); // Clear session key after 10 minutes (600000 milliseconds)
      sendResponse({ status: "Session key set" });
      console.log("Session key set with timeout");
    } else if (request.type === "clearSessionKey") {
      sessionKey = null;
      encryptedSessionKey = null;
      clearTimeout(sessionTimeout);
      sendResponse({ status: "Session key cleared" });
      console.log("Session key and encrypted key cleared manually");
    } else if (request.type === "getDecryptedKey") {
      if (encryptedSessionKey && sessionKey) {
        sendResponse({ encryptedSessionKey: encryptedSessionKey, sessionKey: sessionKey });
        console.log("Encrypted session key retrieved");
      } else {
        sendResponse({ encryptedSessionKey: null, sessionKey: null });
        console.log("No encrypted session key available");
      }
    } else if (request.type === "log") {
      console.log("Log from popup:", request.message);
      sendResponse({ status: "Logged" });
    }
  } catch (error) {
    console.error("Error handling message in background:", error);
    sendResponse({ status: "Error", message: error.message });
  }
});
