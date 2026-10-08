// ══════════════════════════════════════════════════════
//  CRYPTO.JS — Utilitaires de chiffrement partagés
//  Chargé avant : login.js, app.js, settings.js
// ══════════════════════════════════════════════════════

// ── 1. Hash SHA-256 (vérification de mot de passe) ─────
async function hashPassword(password) {
  const buf  = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── 2. Sel aléatoire — 16 octets → base64 ──────────────
function generateSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr));
}

// ── 3. Dérivation PBKDF2 → AES-256-GCM ─────────────────
// Le mot de passe + sel → clé symétrique. Jamais stockée en base.
async function deriveKey(password, saltBase64) {
  const enc  = new TextEncoder();
  const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,               // exportable pour sessionStorage
    ["encrypt", "decrypt"]
  );
}

// ── 4. Export / Import de clé (sessionStorage) ──────────
async function exportKey(cryptoKey) {
  const raw = await crypto.subtle.exportKey("raw", cryptoKey);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

async function importKey(base64) {
  const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ── 5. Chiffrement AES-256-GCM ──────────────────────────
// Retourne { iv: "base64", data: "base64" }
async function encryptData(payload, cryptoKey) {
  const iv      = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const ct      = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, encoded);
  return {
    iv:   btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(ct)))
  };
}

// ── 6. Déchiffrement AES-256-GCM ────────────────────────
async function decryptData(envelope, cryptoKey) {
  const iv = Uint8Array.from(atob(envelope.iv),   c => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(envelope.data),  c => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ct);
  return JSON.parse(new TextDecoder().decode(pt));
}

// ── 7. Détection de données chiffrées ───────────────────
function isEncrypted(d) {
  return d !== null &&
    typeof d === "object" &&
    !Array.isArray(d) &&
    "iv"   in d &&
    "data" in d;
}
