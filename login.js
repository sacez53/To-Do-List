// ═══════════════════════════════════════════════════
// Utilitaires
// ═══════════════════════════════════════════════════

/** Hash SHA-256 côté client via Web Crypto API */
async function hashPassword(password) {
  const buffer = new TextEncoder().encode(password);
  const hash   = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Charge la config et retourne l'URL Firebase nettoyée */
async function getFirebaseUrl() {
  const res    = await fetch("./config.json");
  const config = await res.json();
  if (!config.firebaseUrl || !config.firebaseUrl.trim()) {
    throw new Error("Firebase non configuré dans config.json");
  }
  return config.firebaseUrl.replace(/\/$/, "");
}

/** Valide le format d'un identifiant */
function isValidUsername(u) {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(u);
}

/** Affiche un message d'erreur */
function showError(el, msg) {
  el.textContent = msg;
  el.className = "msg error visible";
  setTimeout(() => el.classList.remove("visible"), 4000);
}

/** Affiche un message de succès */
function showSuccess(el, msg) {
  el.textContent = msg;
  el.className = "msg success visible";
}

/** Verrouille / déverrouille un bouton pendant un chargement */
function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.textContent = loading ? "..." : btn.dataset.label;
}

// ═══════════════════════════════════════════════════
// CONNEXION
// ═══════════════════════════════════════════════════
const loginForm  = document.getElementById("form-login");
const loginBtn   = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");

loginBtn.dataset.label = "Se connecter";

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("login-user").value.trim();
  const password = document.getElementById("login-pass").value;

  if (!username || !password) {
    showError(loginError, "Remplissez tous les champs.");
    return;
  }

  setLoading(loginBtn, true);

  try {
    const fbUrl = await getFirebaseUrl();

    // Récupère les données de l'utilisateur
    const res      = await fetch(`${fbUrl}/users/${encodeURIComponent(username)}.json`);
    const userData = await res.json();

    if (!userData || !userData.password) {
      showError(loginError, "Identifiant introuvable.");
      setLoading(loginBtn, false);
      return;
    }

    // Vérifie le mot de passe
    const hash = await hashPassword(password);
    if (hash !== userData.password) {
      showError(loginError, "Mot de passe incorrect.");
      document.getElementById("login-pass").value = "";
      document.getElementById("login-pass").focus();
      setLoading(loginBtn, false);
      return;
    }

    // Connexion réussie
    sessionStorage.setItem("auth",     "true");
    sessionStorage.setItem("username", username);
    window.location.href = "./app.html";

  } catch (err) {
    console.error(err);
    showError(loginError, err.message || "Erreur de connexion.");
    setLoading(loginBtn, false);
  }
});

// ═══════════════════════════════════════════════════
// INSCRIPTION
// ═══════════════════════════════════════════════════
const registerForm    = document.getElementById("form-register");
const registerBtn     = document.getElementById("register-btn");
const registerError   = document.getElementById("register-error");
const registerSuccess = document.getElementById("register-success");

registerBtn.dataset.label = "Créer mon compte";

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("reg-user").value.trim();
  const password = document.getElementById("reg-pass").value;
  const confirm  = document.getElementById("reg-confirm").value;

  // Validations
  if (!username || !password || !confirm) {
    showError(registerError, "Remplissez tous les champs.");
    return;
  }
  if (!isValidUsername(username)) {
    showError(registerError, "Identifiant invalide (3–20 car., lettres/chiffres/_/-).");
    document.getElementById("reg-user").focus();
    return;
  }
  if (password.length < 5) {
    showError(registerError, "Mot de passe trop court (min. 5 caractères).");
    document.getElementById("reg-pass").focus();
    return;
  }
  if (password !== confirm) {
    showError(registerError, "Les mots de passe ne correspondent pas.");
    document.getElementById("reg-confirm").value = "";
    document.getElementById("reg-confirm").focus();
    return;
  }

  setLoading(registerBtn, true);

  try {
    const fbUrl = await getFirebaseUrl();

    // Vérifie si l'identifiant est déjà pris
    const check = await fetch(`${fbUrl}/users/${encodeURIComponent(username)}/password.json`);
    const exists = await check.json();

    if (exists) {
      showError(registerError, "Cet identifiant est déjà utilisé.");
      document.getElementById("reg-user").focus();
      setLoading(registerBtn, false);
      return;
    }

    // Crée le compte
    const hash = await hashPassword(password);
    await fetch(`${fbUrl}/users/${encodeURIComponent(username)}.json`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password: hash, todos: null })
    });

    // Connexion automatique
    sessionStorage.setItem("auth",     "true");
    sessionStorage.setItem("username", username);

    showSuccess(registerSuccess, `Compte créé ! Redirection...`);
    setTimeout(() => { window.location.href = "./app.html"; }, 900);

  } catch (err) {
    console.error(err);
    showError(registerError, err.message || "Erreur lors de l'inscription.");
    setLoading(registerBtn, false);
  }
});
