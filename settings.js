// ══════════════════════════════════════════════════════
//  SETTINGS.JS
//  Dépend de crypto.js (chargé avant dans settings.html)
// ══════════════════════════════════════════════════════

// ─── Session ───────────────────────────────────────────
let currentUser = sessionStorage.getItem("username") || "";
const userLabel  = document.getElementById("user-label");
if (userLabel) userLabel.textContent = currentUser;

// ─── Clé de chiffrement ────────────────────────────────
let encKey = null;
(async () => {
  const b64 = sessionStorage.getItem("encKey");
  if (b64) {
    try { encKey = await importKey(b64); } catch (e) { /* sans clé */ }
  }
})();

// ─── Firebase ──────────────────────────────────────────
let firebaseUrl = null;

async function getFirebaseUrl() {
  if (firebaseUrl) return firebaseUrl;
  const res    = await fetch("./config.json");
  const config = await res.json();
  if (!config.firebaseUrl || !config.firebaseUrl.trim()) {
    throw new Error("Firebase non configuré.");
  }
  firebaseUrl = config.firebaseUrl.replace(/\/$/, "");
  return firebaseUrl;
}

function userPath(username) {
  return `${firebaseUrl}/users/${encodeURIComponent(username)}`;
}

// ─── Déconnexion ───────────────────────────────────────
document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("auth");
  sessionStorage.removeItem("username");
  sessionStorage.removeItem("encKey");
  sessionStorage.removeItem("encSalt");
  window.location.href = "./login.html";
});

// ─── Utilitaires UI ────────────────────────────────────
function showMsg(el, msg, isError = false) {
  el.textContent = msg;
  el.className   = `settings-msg ${isError ? "settings-msg-error" : "settings-msg-success"} visible`;
  if (isError) {
    setTimeout(() => {
      el.classList.remove("visible");
      el.className = "settings-msg";
    }, 5000);
  }
}

function clearMsg(el) {
  el.className   = "settings-msg";
  el.textContent = "";
}

function setLoading(btn, loading, originalLabel) {
  btn.disabled    = loading;
  btn.textContent = loading ? "..." : originalLabel;
}

// ══════════════════════════════════════════════════════
//  1. CHANGER L'IDENTIFIANT
// ══════════════════════════════════════════════════════
const btnChangeUsername = document.getElementById("btn-change-username");
const USERNAME_LABEL    = "Changer l'identifiant";

btnChangeUsername.addEventListener("click", async () => {
  const msgEl   = document.getElementById("msg-username");
  const newName = document.getElementById("new-username").value.trim();
  const password= document.getElementById("confirm-pass-username").value;

  clearMsg(msgEl);

  // Validations côté client
  if (!newName || !password) {
    showMsg(msgEl, "Remplissez tous les champs.", true); return;
  }
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(newName)) {
    showMsg(msgEl, "Identifiant invalide — 3 à 20 car., lettres/chiffres/_/-.", true); return;
  }
  if (newName === currentUser) {
    showMsg(msgEl, "C'est déjà votre identifiant.", true); return;
  }

  setLoading(btnChangeUsername, true, USERNAME_LABEL);

  try {
    const fbUrl = await getFirebaseUrl();

    // 1. Vérifie le mot de passe
    const hash       = await hashPassword(password);
    const passRes    = await fetch(`${userPath(currentUser)}/password.json`);
    const storedHash = await passRes.json();
    if (hash !== storedHash) {
      showMsg(msgEl, "Mot de passe incorrect.", true);
      setLoading(btnChangeUsername, false, USERNAME_LABEL); return;
    }

    // 2. Vérifie si le nouvel identifiant est libre
    const checkRes = await fetch(`${userPath(newName)}/password.json`);
    const exists   = await checkRes.json();
    if (exists) {
      showMsg(msgEl, "Cet identifiant est déjà utilisé.", true);
      setLoading(btnChangeUsername, false, USERNAME_LABEL); return;
    }

    // 3. Copie toutes les données vers le nouveau nœud
    const oldDataRes = await fetch(`${userPath(currentUser)}.json`);
    const oldData    = await oldDataRes.json();

    await fetch(`${userPath(newName)}.json`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(oldData)
    });

    // 4. Supprime l'ancien nœud
    await fetch(`${userPath(currentUser)}.json`, { method: "DELETE" });

    // 5. Met à jour la session
    const previous = currentUser;
    currentUser    = newName;
    sessionStorage.setItem("username", newName);
    localStorage.removeItem(`todos_${previous}`);

    showMsg(msgEl, `✓ Identifiant changé en « ${newName} ». Redirection...`);
    setTimeout(() => { window.location.href = "./app.html"; }, 1800);

  } catch (err) {
    console.error(err);
    showMsg(msgEl, err.message || "Erreur lors du changement.", true);
    setLoading(btnChangeUsername, false, USERNAME_LABEL);
  }
});

// ══════════════════════════════════════════════════════
//  2. CHANGER LE MOT DE PASSE
// ══════════════════════════════════════════════════════
const btnChangePassword = document.getElementById("btn-change-password");
const PASSWORD_LABEL    = "Changer le mot de passe";

btnChangePassword.addEventListener("click", async () => {
  const msgEl      = document.getElementById("msg-password");
  const oldPass    = document.getElementById("old-password").value;
  const newPass    = document.getElementById("new-password").value;
  const confirmPass= document.getElementById("confirm-new-password").value;

  clearMsg(msgEl);

  // Validations côté client
  if (!oldPass || !newPass || !confirmPass) {
    showMsg(msgEl, "Remplissez tous les champs.", true); return;
  }
  if (newPass.length < 5) {
    showMsg(msgEl, "Nouveau mot de passe trop court (min. 5 car.).", true); return;
  }
  if (newPass !== confirmPass) {
    showMsg(msgEl, "Les nouveaux mots de passe ne correspondent pas.", true); return;
  }
  if (newPass === oldPass) {
    showMsg(msgEl, "Le nouveau mot de passe doit être différent.", true); return;
  }

  setLoading(btnChangePassword, true, PASSWORD_LABEL);

  try {
    const fbUrl = await getFirebaseUrl();

    // 1. Vérifie l'ancien mot de passe
    const oldHash    = await hashPassword(oldPass);
    const passRes    = await fetch(`${userPath(currentUser)}/password.json`);
    const storedHash = await passRes.json();
    if (oldHash !== storedHash) {
      showMsg(msgEl, "Mot de passe actuel incorrect.", true);
      setLoading(btnChangePassword, false, PASSWORD_LABEL); return;
    }

    // 2. Récupère le sel du compte
    const saltRes = await fetch(`${userPath(currentUser)}/salt.json`);
    const salt    = await saltRes.json();
    if (!salt) throw new Error("Sel introuvable — compte corrompu.");

    // 3. Récupère les tâches chiffrées
    const todosRes  = await fetch(`${userPath(currentUser)}/todos.json`);
    const todosData = await todosRes.json();

    // 4. Déchiffre avec l'ancienne clé
    let todos = [];
    if (todosData && isEncrypted(todosData) && encKey) {
      todos = await decryptData(todosData, encKey);
    } else if (Array.isArray(todosData)) {
      todos = todosData;
    }

    // 5. Hache le nouveau mot de passe
    const newHash = await hashPassword(newPass);

    // 6. Dérive la nouvelle clé (même sel + nouveau mot de passe)
    const newKey = await deriveKey(newPass, salt);

    // 7. Re-chiffre les tâches avec la nouvelle clé
    const updates = { password: newHash };
    if (todos.length > 0) {
      updates.todos = await encryptData(todos, newKey);
    }

    // 8. Met à jour Firebase (PATCH = seulement les champs spécifiés)
    await fetch(`${userPath(currentUser)}.json`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(updates)
    });

    // 9. Met à jour la session avec la nouvelle clé
    const newKeyB64 = await exportKey(newKey);
    sessionStorage.setItem("encKey", newKeyB64);
    encKey = newKey;

    // Vide les champs
    document.getElementById("old-password").value      = "";
    document.getElementById("new-password").value      = "";
    document.getElementById("confirm-new-password").value = "";

    showMsg(msgEl, "✓ Mot de passe changé — tâches re-chiffrées avec succès !");
    setLoading(btnChangePassword, false, PASSWORD_LABEL);

  } catch (err) {
    console.error(err);
    showMsg(msgEl, err.message || "Erreur lors du changement.", true);
    setLoading(btnChangePassword, false, PASSWORD_LABEL);
  }
});

// ══════════════════════════════════════════════════════
//  3. SUPPRIMER LE COMPTE
// ══════════════════════════════════════════════════════
const btnDeleteAccount = document.getElementById("btn-delete-account");
const deleteOverlay    = document.getElementById("delete-overlay");
const deleteConfirmYes = document.getElementById("delete-confirm-yes");
const deleteConfirmNo  = document.getElementById("delete-confirm-no");
const DELETE_LABEL     = "Supprimer mon compte";

// Ouvre la modale de confirmation
btnDeleteAccount.addEventListener("click", async () => {
  const msgEl   = document.getElementById("msg-delete");
  const password= document.getElementById("confirm-pass-delete").value;

  clearMsg(msgEl);

  if (!password) {
    showMsg(msgEl, "Saisissez votre mot de passe pour confirmer.", true); return;
  }

  setLoading(btnDeleteAccount, true, DELETE_LABEL);

  try {
    const fbUrl = await getFirebaseUrl();

    // Vérifie le mot de passe avant d'ouvrir la modale
    const hash       = await hashPassword(password);
    const passRes    = await fetch(`${userPath(currentUser)}/password.json`);
    const storedHash = await passRes.json();

    if (hash !== storedHash) {
      showMsg(msgEl, "Mot de passe incorrect.", true);
      setLoading(btnDeleteAccount, false, DELETE_LABEL); return;
    }

    // Mot de passe OK → ouvre la confirmation
    setLoading(btnDeleteAccount, false, DELETE_LABEL);
    deleteOverlay.classList.add("open");
    document.body.classList.add("modal-open");

  } catch (err) {
    console.error(err);
    showMsg(document.getElementById("msg-delete"), err.message || "Erreur.", true);
    setLoading(btnDeleteAccount, false, DELETE_LABEL);
  }
});

// Annulation
deleteConfirmNo.addEventListener("click", () => {
  deleteOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
});
deleteOverlay.addEventListener("click", e => {
  if (e.target === deleteOverlay) {
    deleteOverlay.classList.remove("open");
    document.body.classList.remove("modal-open");
  }
});

// Confirmation — suppression réelle
deleteConfirmYes.addEventListener("click", async () => {
  deleteConfirmYes.disabled = true;
  deleteConfirmYes.textContent = "...";

  try {
    const fbUrl = await getFirebaseUrl();

    // Supprime le nœud entier de l'utilisateur
    await fetch(`${userPath(currentUser)}.json`, { method: "DELETE" });

    // Nettoie la session et le localStorage
    localStorage.removeItem(`todos_${currentUser}`);
    sessionStorage.clear();

    // Redirige vers l'accueil
    window.location.href = "./index.html";

  } catch (err) {
    console.error(err);
    deleteConfirmYes.disabled    = false;
    deleteConfirmYes.textContent = "Supprimer";
    deleteOverlay.classList.remove("open");
    document.body.classList.remove("modal-open");
    showMsg(document.getElementById("msg-delete"), err.message || "Erreur lors de la suppression.", true);
  }
});

// Fermeture au clavier
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    deleteOverlay.classList.remove("open");
    document.body.classList.remove("modal-open");
  }
});
