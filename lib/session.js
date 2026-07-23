// Jeton de session opaque signé (HMAC-SHA256), au lieu de stocker le mot de
// passe lui-même dans le cookie. La clé de signature dérive de
// SITE_PASSWORD mais ne peut pas être retrouvée à partir du jeton : quelqu'un
// qui lit le cookie récupère un jeton inutilisable ailleurs, pas le mot de
// passe. Le jeton encode aussi sa date d'émission pour expirer naturellement.
// Utilise Web Crypto (`crypto.subtle`) plutôt que le module `crypto` de Node
// car ce fichier est importé à la fois par une route API (runtime Node) et
// par middleware.js (runtime Edge), où seul Web Crypto est disponible.

const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 jours

let cachedKeyPromise = null;

function getKey() {
  if (!cachedKeyPromise) {
    const secret = process.env.SITE_PASSWORD || '';
    cachedKeyPromise = crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
  }
  return cachedKeyPromise;
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionToken() {
  const issuedAt = Date.now().toString(36);
  const key = await getKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(issuedAt));
  return `${issuedAt}.${toHex(signature)}`;
}

export async function verifySessionToken(token) {
  if (!token || !token.includes('.')) return false;
  const [issuedAt, signatureHex] = token.split('.');
  const issuedAtMs = parseInt(issuedAt, 36);
  if (!Number.isFinite(issuedAtMs) || Date.now() - issuedAtMs > MAX_AGE_MS) return false;

  const key = await getKey();
  const expectedSignature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(issuedAt));
  const expectedHex = toHex(expectedSignature);

  if (expectedHex.length !== signatureHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) diff |= expectedHex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
  return diff === 0;
}

export const SESSION_MAX_AGE_SECONDS = MAX_AGE_MS / 1000;
