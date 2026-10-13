// ═══════════════════════════════════════════════════
//  LOGIN.JS
//  Dépend de crypto.js (chargé avant dans login.html)
// ═══════════════════════════════════════════════════

// ─── Utilitaires UI ────────────────────────────────

let cachedFirebaseUrl = null;

async function getFirebaseUrl() {
  if (cachedFirebaseUrl) return cachedFirebaseUrl;
  const res = await fetch("../assets/json/firebase.json");
  const config = await res.json();
  if (!config.url || !config.url.trim()) {
    throw new Error("Firebase non configuré dans firebase.json");
  }
  cachedFirebaseUrl = config.url.replace(/\/$/, "");
  return cachedFirebaseUrl;
}

async function getSecurityConfig() {
  const res = await fetch("../assets/json/security.json");
  return await res.json();
}

/** Valide le format d'un identifiant */
function isValidUsername(u) {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(u);
}

function showError(el, msg) {
  el.textContent = msg;
  el.className   = "msg error visible";
  setTimeout(() => el.classList.remove("visible"), 4000);
}

function showSuccess(el, msg) {
  el.textContent = msg;
  el.className   = "msg success visible";
}

function setLoading(btn, loading) {
  btn.disabled    = loading;
  btn.textContent = loading ? "..." : btn.dataset.label;
}

// ═══════════════════════════════════════════════════
//  CONNEXION
// ═══════════════════════════════════════════════════
const loginForm  = document.getElementById("form-login");
const loginBtn   = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");

loginBtn.dataset.label = t("btn_login");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("login-user").value.trim();
  const password = document.getElementById("login-pass").value;

  if (!username || !password) {
    showError(loginError, t("error_fill_fields"));
    return;
  }

  setLoading(loginBtn, true);

  try {
    const fbUrl = await getFirebaseUrl();

    // Récupère les données de l'utilisateur
    const res      = await fetch(`${fbUrl}/users/${encodeURIComponent(username)}.json`);
    const userData = await res.json();

    if (!userData || !userData.password) {
      showError(loginError, t("error_user_not_found"));
      setLoading(loginBtn, false);
      return;
    }

    // ── Vérification et Migration du mot de passe ──
    const oldHash = await hashPassword(password);
    const isOldHash = (oldHash === userData.password);

    let salt = userData.salt;
    if (!salt) {
      salt = generateSalt();
      // On sauvegarde le sel s'il manquait
      await fetch(`${fbUrl}/users/${encodeURIComponent(username)}/salt.json`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(salt)
      });
    }

    const strongHash = await hashPasswordPBKDF2(password, salt);
    const isStrongHash = (strongHash === userData.password);

    if (!isOldHash && !isStrongHash) {
      showError(loginError, t("error_wrong_pass"));
      document.getElementById("login-pass").value = "";
      document.getElementById("login-pass").focus();
      setLoading(loginBtn, false);
      return;
    }

    // Migration automatique vers PBKDF2 si l'utilisateur est encore sous SHA-256
    if (isOldHash && oldHash !== strongHash) {
      await fetch(`${fbUrl}/users/${encodeURIComponent(username)}/password.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(strongHash)
      });
      console.log("Migration de sécurité du mot de passe réussie !");
    }

    // ── Dérive la clé AES-256-GCM depuis le mot de passe ──
    const key    = await deriveKey(password, salt);
    const keyB64 = await exportKey(key);

    // ── Langue utilisateur ──
    if (userData.lang && (userData.lang === "fr" || userData.lang === "en")) {
      setLanguage(userData.lang);
    } else {
      // Si la langue n'est pas encore enregistrée en DB, on synchronise la langue actuelle
      syncUserLanguageToFirebase(username, getLanguage());
    }

    // ── Session ──
    sessionStorage.setItem("auth",     "true");
    sessionStorage.setItem("username", username);
    sessionStorage.setItem("encKey",   keyB64);
    sessionStorage.setItem("encSalt",  salt);

    const urlParams = new URLSearchParams(window.location.search);
    const redirectPage = urlParams.get('redirect');
    const nextUrl = redirectPage ? `./${redirectPage}` : `./welcome.html`;
    window.transitionTo(nextUrl);

  } catch (err) {
    console.error(err);
    showError(loginError, err.message || t("error_user_not_found"));
    setLoading(loginBtn, false);
  }
});

// ═══════════════════════════════════════════════════
//  INSCRIPTION
// ═══════════════════════════════════════════════════
const registerForm    = document.getElementById("form-register");
const registerBtn     = document.getElementById("register-btn");
const registerError   = document.getElementById("register-error");
const registerSuccess = document.getElementById("register-success");

registerBtn.dataset.label = t("btn_register");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("reg-user").value.trim();
  const password = document.getElementById("reg-pass").value;
  const confirm  = document.getElementById("reg-confirm").value;
  const regLangEl= document.getElementById("reg-lang");
  const lang     = (regLangEl ? regLangEl.value : getLanguage()) || "fr";

  if (!username || !password || !confirm) {
    showError(registerError, t("error_fill_fields"));
    return;
  }
  if (!isValidUsername(username)) {
    showError(registerError, t("error_invalid_user"));
    document.getElementById("reg-user").focus();
    return;
  }
  if (password !== confirm) {
    showError(registerError, t("error_pass_match"));
    document.getElementById("reg-confirm").value = "";
    document.getElementById("reg-confirm").focus();
    return;
  }

  setLoading(registerBtn, true);

  try {
    const secConfig = await getSecurityConfig();
    const minLen = secConfig.minPasswordLength || 5;
    
    if (password.length < minLen) {
      showError(registerError, t("error_pass_short", { min: minLen }));
      document.getElementById("reg-pass").focus();
      setLoading(registerBtn, false);
      return;
    }

    const fbUrl = await getFirebaseUrl();

    // Vérifie si l'identifiant est déjà pris
    const check  = await fetch(`${fbUrl}/users/${encodeURIComponent(username)}/password.json`);
    const exists = await check.json();

    if (exists) {
      showError(registerError, t("error_user_taken"));
      document.getElementById("reg-user").focus();
      setLoading(registerBtn, false);
      return;
    }

    // ── Crée le compte avec sel et langue choisie ──
    const salt = generateSalt();
    const hash = await hashPasswordPBKDF2(password, salt);

    await fetch(`${fbUrl}/users/${encodeURIComponent(username)}.json`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password: hash, salt, lang, todos: null })
    });

    // ── Dérive la clé et démarre la session ──
    const key    = await deriveKey(password, salt);
    const keyB64 = await exportKey(key);

    setLanguage(lang);

    sessionStorage.setItem("auth",     "true");
    sessionStorage.setItem("username", username);
    sessionStorage.setItem("encKey",   keyB64);
    sessionStorage.setItem("encSalt",  salt);

    const urlParams = new URLSearchParams(window.location.search);
    const redirectPage = urlParams.get('redirect');
    const nextUrl = redirectPage ? `./${redirectPage}` : `./welcome.html`;

    showSuccess(registerSuccess, t("success_account_created"));
    setTimeout(() => { window.transitionTo(nextUrl); }, 900);

  } catch (err) {
    console.error(err);
    showError(registerError, err.message || t("error_fill_fields"));
    setLoading(registerBtn, false);
  }
});
