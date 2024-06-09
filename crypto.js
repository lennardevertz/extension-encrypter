async function encryptPrivateKey(privateKey, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const passwordKey = await deriveKey(password, salt);

  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    passwordKey,
    new TextEncoder().encode(privateKey)
  );

  return { iv: Array.from(iv), salt: Array.from(salt), content: Array.from(new Uint8Array(encryptedContent)) };
}

async function decryptPrivateKey(encryptedKey, password) {
  const salt = new Uint8Array(encryptedKey.salt);
  const passwordKey = await deriveKey(password, salt);

  const decryptedContent = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(encryptedKey.iv)
    },
    passwordKey,
    new Uint8Array(encryptedKey.content)
  );

  return new TextDecoder().decode(decryptedContent);
}

async function encryptWithSessionKey(data, sessionKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    sessionKey,
    new TextEncoder().encode(data)
  );
  return { iv: Array.from(iv), content: Array.from(new Uint8Array(encryptedData)) };
}

async function decryptWithSessionKey(encryptedData, sessionKey) {
  const iv = new Uint8Array(encryptedData.iv);
  const content = new Uint8Array(encryptedData.content);
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    sessionKey,
    content
  );
  return new TextDecoder().decode(decryptedData);
}

async function deriveKey(password, salt) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function generateSessionKey(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  return { key: Array.from(new Uint8Array(exportedKey)), salt: Array.from(salt) };
}

async function importSessionKey(keyBytes, salt) {
  const keyBuffer = new Uint8Array(keyBytes).buffer;
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
}
