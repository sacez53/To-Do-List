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
const keyReady = (async () => {
  const b64 = sessionStorage.getItem("encKey");
  if (b64) {
    try { encKey = await importKey(b64); } catch (e) { /* sans clé */ }
  }
})();

// ─── Firebase ──────────────────────────────────────────
let firebaseUrl = null;

async function getFirebaseUrl() {
  if (firebaseUrl) return firebaseUrl;
  const res    = await TodoRuntime.fetch("../assets/json/firebase.json");
  const config = await res.json();
  if (!config.url || !config.url.trim()) {
    throw new Error("Firebase non configuré.");
  }
  firebaseUrl = config.url.replace(/\/$/, "");
  return firebaseUrl;
}

async function verifyUserPassword(username, password) {
  await getFirebaseUrl();
  const res = await TodoRuntime.fetch(`${userPath(username)}.json`);
  const userData = await res.json();
  if (!userData || !userData.password) {
    return { ok: false, reason: TodoRuntime.message("Identifiant introuvable.", "Username not found.") };
  }
  const oldHash = await hashPassword(password);
  const isOldHash = (oldHash === userData.password);

  let isStrongHash = false;
  if (userData.salt) {
    const strongHash = await hashPasswordPBKDF2(password, userData.salt);
    isStrongHash = (strongHash === userData.password);
  }

  if (!isOldHash && !isStrongHash) {
    return { ok: false, reason: TodoRuntime.message("Mot de passe incorrect.", "Incorrect password.") };
  }

  return { ok: true, userData, isOldHash, isStrongHash };
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
  window.transitionTo("./login.html");
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
const USERNAME_LABEL    = TodoRuntime.message("Changer l'identifiant", "Change username");

btnChangeUsername.addEventListener("click", async () => {
  const msgEl   = document.getElementById("msg-username");
  const newName = document.getElementById("new-username").value.trim();
  const password= document.getElementById("confirm-pass-username").value;

  clearMsg(msgEl);

  // Validations côté client
  if (!newName || !password) {
    showMsg(msgEl, TodoRuntime.message("Remplissez tous les champs.", "Fill in all fields."), true); return;
  }
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(newName)) {
    showMsg(msgEl, TodoRuntime.message("Identifiant invalide — 3 à 20 car., lettres/chiffres/_/-.", "Invalid username: 3–20 letters, digits, _ or -."), true); return;
  }
  if (newName === currentUser) {
    showMsg(msgEl, TodoRuntime.message("C'est déjà votre identifiant.", "This is already your username."), true); return;
  }

  setLoading(btnChangeUsername, true, USERNAME_LABEL);

  try {
    const fbUrl = await getFirebaseUrl();

    // 1. Vérifie le mot de passe
    const authCheck = await verifyUserPassword(currentUser, password);
    if (!authCheck.ok) {
      showMsg(msgEl, authCheck.reason || TodoRuntime.message("Mot de passe incorrect.", "Incorrect password."), true);
      setLoading(btnChangeUsername, false, USERNAME_LABEL); return;
    }

    const store = await TodoData.open(currentUser);
    await store.sync();
    // 2. Vérifie si le nouvel identifiant est libre
    const checkRes = await TodoRuntime.fetch(`${userPath(newName)}/password.json`);
    const exists   = await checkRes.json();
    if (exists) {
      showMsg(msgEl, TodoRuntime.message("Cet identifiant est déjà utilisé.", "This username is already in use."), true);
      setLoading(btnChangeUsername, false, USERNAME_LABEL); return;
    }

    // 3. Copie toutes les données vers le nouveau nœud
    const oldDataRes = await TodoRuntime.fetch(`${userPath(currentUser)}.json`, { headers: { "X-Firebase-ETag": "true" } });
    const oldEtag = oldDataRes.headers.get("ETag");
    if (!oldEtag) throw new Error("Missing Firebase ETag");
    const oldData    = await oldDataRes.json();

    await TodoRuntime.fetch(`${userPath(newName)}.json`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json", "if-match": "null_etag" },
      body:    JSON.stringify(oldData)
    });

    // 4. Supprime l'ancien nœud
    await TodoRuntime.fetch(`${userPath(currentUser)}.json`, { method: "DELETE", headers: { "if-match": oldEtag } });

    // 5. Met à jour la session
    const previous = currentUser;
    currentUser    = newName;
    sessionStorage.setItem("username", newName);
    localStorage.removeItem(`todos_${previous}`);
    localStorage.removeItem(`todo_state_${previous}`);

    showMsg(msgEl, `✓ Identifiant changé en « ${newName} ». Redirection...`);
    setTimeout(() => { window.transitionTo("./app.html"); }, 1800);

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
const PASSWORD_LABEL    = TodoRuntime.message("Changer le mot de passe", "Change password");

btnChangePassword.addEventListener("click", async () => {
  const msgEl      = document.getElementById("msg-password");
  const oldPass    = document.getElementById("old-password").value;
  const newPass    = document.getElementById("new-password").value;
  const confirmPass= document.getElementById("confirm-new-password").value;

  clearMsg(msgEl);

  // Validations côté client
  if (!oldPass || !newPass || !confirmPass) {
    showMsg(msgEl, TodoRuntime.message("Remplissez tous les champs.", "Fill in all fields."), true); return;
  }
  if (newPass.length < 5) {
    showMsg(msgEl, TodoRuntime.message("Nouveau mot de passe trop court (min. 5 car.).", "New password is too short (minimum 5 characters)."), true); return;
  }
  if (newPass !== confirmPass) {
    showMsg(msgEl, TodoRuntime.message("Les nouveaux mots de passe ne correspondent pas.", "The new passwords do not match."), true); return;
  }
  if (newPass === oldPass) {
    showMsg(msgEl, TodoRuntime.message("Le nouveau mot de passe doit être différent.", "The new password must be different."), true); return;
  }

  setLoading(btnChangePassword, true, PASSWORD_LABEL);

  try {
    const fbUrl = await getFirebaseUrl();

    // 1. Vérifie l'ancien mot de passe
    const authCheck = await verifyUserPassword(currentUser, oldPass);
    if (!authCheck.ok) {
      showMsg(msgEl, authCheck.reason || "Mot de passe actuel incorrect.", true);
      setLoading(btnChangePassword, false, PASSWORD_LABEL); return;
    }

    await keyReady;
    if (!encKey) throw new Error(TodoRuntime.message("Clé absente. Reconnectez-vous avant de changer de mot de passe.", "Missing key. Sign in again before changing your password."));
    const store = await TodoData.open(currentUser);
    await store.sync();
    const accountRes = await TodoRuntime.fetch(`${userPath(currentUser)}.json`, { headers: { "X-Firebase-ETag": "true" } });
    const accountEtag = accountRes.headers.get("ETag");
    const account = await accountRes.json();
    if (!accountEtag) throw new Error("Missing Firebase ETag");
    // 2. Récupère ou génère le sel du compte
    let salt = authCheck.userData.salt;
    if (!salt) {
      salt = generateSalt();
    }

    const todosData = account.todos;
    const todos = TodoData.normalize(isEncrypted(todosData) ? await decryptData(todosData, encKey) : todosData);

    // 5. Hache le nouveau mot de passe avec PBKDF2
    const newHash = await hashPasswordPBKDF2(newPass, salt);

    // 6. Dérive la nouvelle clé (même sel + nouveau mot de passe)
    const newKey = await deriveKey(newPass, salt);

    // 7. Re-chiffre les tâches avec la nouvelle clé
    const updates = { ...account, password: newHash, salt, todos: await encryptData(todos, newKey) };
    // Compare the whole account: tasks and credentials change together or not at all.
    await TodoRuntime.fetch(`${userPath(currentUser)}.json`, {
      method: "PUT", headers: { "Content-Type": "application/json", "if-match": accountEtag },
      body: JSON.stringify(updates)
    });
    // Update session immediately after the confirmed atomic server write.
    const newKeyB64 = await exportKey(newKey);
    sessionStorage.setItem("encKey", newKeyB64);
    sessionStorage.setItem("encSalt", salt);
    encKey = newKey;
    try {
      localStorage.setItem(`todo_state_${currentUser}`, JSON.stringify(await encryptData({ base: todos, local: todos, pending: false }, newKey)));
    } catch (error) {
      // The server already owns the confirmed snapshot; discard only the obsolete-key cache.
      localStorage.removeItem(`todo_state_${currentUser}`);
      throw error;
    }
    archiveStore = await TodoData.open(currentUser);
    updateArchivedView();

    // Vide les champs
    document.getElementById("old-password").value      = "";
    document.getElementById("new-password").value      = "";
    document.getElementById("confirm-new-password").value = "";

    showMsg(msgEl, TodoRuntime.message("✓ Mot de passe changé — tâches re-chiffrées avec succès !", "✓ Password changed — tasks encrypted with the new key."));
    setLoading(btnChangePassword, false, PASSWORD_LABEL);

  } catch (err) {
    console.error(err);
    showMsg(msgEl, err.message || "Erreur lors du changement.", true);
    setLoading(btnChangePassword, false, PASSWORD_LABEL);
  }
});

// ══════════════════════════════════════════════════════
//  3. PRÉFÉRENCES D'AFFICHAGE & LANGUE
// ══════════════════════════════════════════════════════
const btnSaveDisplay     = document.getElementById("btn-save-display");
const selectCalendarView = document.getElementById("setting-calendar-view");
const selectLanguage     = document.getElementById("setting-language");

// Chargement initial
const currentCalendarPref = localStorage.getItem(`calendarView_${currentUser}`) || "grid";
if (selectCalendarView) {
  selectCalendarView.value = currentCalendarPref;
}
if (selectLanguage) {
  selectLanguage.value = getLanguage();
}

if (btnSaveDisplay) {
  btnSaveDisplay.addEventListener("click", async () => {
    const msgEl = document.getElementById("msg-display");
    clearMsg(msgEl);
    btnSaveDisplay.disabled = true;
    try {
    if (selectCalendarView) {
      const selectedView = selectCalendarView.value;
      localStorage.setItem(`calendarView_${currentUser}`, selectedView);
    }

    if (selectLanguage) {
      const newLang = selectLanguage.value;
      setLanguage(newLang);
      await syncUserLanguageToFirebase(currentUser, newLang);
    }
    
    showMsg(msgEl, "✓ " + t("saved_preferences"));
    } catch (error) { showMsg(msgEl, error.message, true); }
    finally { btnSaveDisplay.disabled = false; }
  });
}

// ══════════════════════════════════════════════════════
//  4. SUPPRIMER LE COMPTE
// ══════════════════════════════════════════════════════
const btnDeleteAccount = document.getElementById("btn-delete-account");
const deleteOverlay    = document.getElementById("delete-overlay");
const deleteConfirmYes = document.getElementById("delete-confirm-yes");
const deleteConfirmNo  = document.getElementById("delete-confirm-no");
const DELETE_LABEL     = TodoRuntime.message("Supprimer mon compte", "Delete my account");

// Ouvre la modale de confirmation
btnDeleteAccount.addEventListener("click", async () => {
  const msgEl   = document.getElementById("msg-delete");
  const password= document.getElementById("confirm-pass-delete").value;

  clearMsg(msgEl);

  if (!password) {
    showMsg(msgEl, TodoRuntime.message("Saisissez votre mot de passe pour confirmer.", "Enter your password to confirm."), true); return;
  }

  setLoading(btnDeleteAccount, true, DELETE_LABEL);

  try {
    const fbUrl = await getFirebaseUrl();

    // Vérifie le mot de passe avant d'ouvrir la modale
    const authCheck = await verifyUserPassword(currentUser, password);
    if (!authCheck.ok) {
      showMsg(msgEl, authCheck.reason || TodoRuntime.message("Mot de passe incorrect.", "Incorrect password."), true);
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
    await TodoRuntime.fetch(`${userPath(currentUser)}.json`, { method: "DELETE" });

    // Nettoie la session et le localStorage
    localStorage.removeItem(`todos_${currentUser}`);
    localStorage.removeItem(`todo_state_${currentUser}`);
    localStorage.removeItem(`calendarView_${currentUser}`);
    sessionStorage.clear();

    // Redirige vers l'accueil ou la connexion
    const logoutDest = window.location.pathname.includes('/pages/') ? "../index.html" : "./login.html";
    window.transitionTo(logoutDest);

  } catch (err) {
    console.error(err);
    deleteConfirmYes.disabled    = false;
    deleteConfirmYes.textContent = TodoRuntime.message("Supprimer", "Delete");
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


// ══════════════════════════════════════════════════════
//  5. GESTION DES ARCHIVES
// ══════════════════════════════════════════════════════
let archiveStore = null;
async function loadArchiveStore() {
  archiveStore = await TodoData.open(currentUser);
  try { await archiveStore.sync(); }
  catch (error) { showMsg(document.getElementById("msg-archive"), error.message, true); }
  return archiveStore;
}
function updateArchivedView() {
    const todos = archiveStore ? archiveStore.read() : [];
    const archivedTasks = todos.filter(t => t.archived && !TodoData.removed(t));
    
    const container = document.getElementById("archived-tasks-container");
    const msg = document.getElementById("no-archived-msg");
    
    if (archivedTasks.length > 0) {
        container.style.display = "flex";
        msg.style.display = "none";
        container.innerHTML = "";
        
        archivedTasks.forEach(task => {
            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.alignItems = "center";
            row.style.padding = "0.5rem";
            row.style.background = "var(--surface-3)";
            row.style.borderRadius = "3px";
            
            const span = document.createElement("span");
            span.style.color = "var(--text)";
            span.style.fontSize = "0.8rem";
            span.style.overflow = "hidden";
            span.style.textOverflow = "ellipsis";
            span.style.whiteSpace = "nowrap";
            span.textContent = task.text;
            
            const btnWrap = document.createElement("div");
            btnWrap.style.display = "flex";
            btnWrap.style.gap = "0.5rem";
            
            const btnRestore = document.createElement("button");
            btnRestore.textContent = TodoRuntime.message("Désarchiver", "Unarchive");
            btnRestore.style.background = "transparent";
            btnRestore.style.border = "1px solid var(--line-strong)";
            btnRestore.style.color = "var(--text-muted)";
            btnRestore.style.padding = "0.2rem 0.5rem";
            btnRestore.style.fontSize = "0.7rem";
            btnRestore.style.cursor = "pointer";
            btnRestore.style.borderRadius = "3px";
            btnRestore.addEventListener("click", async () => {
                task.archived = false;
                await saveArchivedChanges(todos);
            });
            
            const btnDelete = document.createElement("button");
            btnDelete.textContent = TodoRuntime.message("Supprimer", "Delete");
            btnDelete.style.background = "transparent";
            btnDelete.style.border = "1px solid rgba(248, 113, 113, 0.4)";
            btnDelete.style.color = "#f87171";
            btnDelete.style.padding = "0.2rem 0.5rem";
            btnDelete.style.fontSize = "0.7rem";
            btnDelete.style.cursor = "pointer";
            btnDelete.style.borderRadius = "3px";
            btnDelete.addEventListener("click", async () => {
                if (confirm(TodoRuntime.message("Placer cette tâche dans la corbeille pendant 30 jours ?", "Move this task to the trash for 30 days?"))) {
                    const deleted = TodoData.trash(task);
                    const newTodos = todos.map(t => t.id === task.id ? deleted : t);
                    if (await saveArchivedChanges(newTodos)) offerArchiveUndo(deleted);
                }
            });
            
            btnWrap.appendChild(btnRestore);
            btnWrap.appendChild(btnDelete);
            row.appendChild(span);
            row.appendChild(btnWrap);
            container.appendChild(row);
        });
    } else {
        container.style.display = "none";
        msg.style.display = "block";
    }
}

function offerArchiveUndo(deleted) {
  document.getElementById("archive-trash-undo")?.remove();
  const button = document.createElement("button"); button.type = "button"; button.id = "archive-trash-undo"; button.className = "btn-save";
  button.textContent = TodoRuntime.message("Annuler la suppression", "Undo deletion");
  document.getElementById("msg-archive").textContent = TodoRuntime.message("Tâche placée dans la corbeille, accessible depuis l’application. Conservation : 30 jours.", "Task moved to the trash in the app. Retention: 30 days.");
  document.getElementById("msg-archive").after(button);
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const current = archiveStore.read();
      const task = current.find(t => String(t.id) === String(deleted.id));
      if (!task) throw new Error(TodoRuntime.message("Tâche indisponible.", "Task unavailable."));
      const restored = TodoData.restore(task, new Date(), deleted.deletionId);
      if (await saveArchivedChanges(current.map(t => t.id === task.id ? restored : t))) {
        const result = archiveStore.read().find(t => t.id === task.id);
        if (!result || TodoData.removed(result)) throw new Error(TodoRuntime.message("Cette tâche a été supprimée définitivement.", "This task was permanently deleted."));
        button.remove();
      }
    } catch (error) { showMsg(document.getElementById("msg-archive"), error.message, true); }
    finally { button.disabled = false; }
  });
}
async function saveArchivedChanges(newTodos) {
  try {
    if (!archiveStore) await loadArchiveStore();
    await archiveStore.save(newTodos);
    updateArchivedView();
    await archiveStore.sync();
    updateArchivedView();
    showMsg(document.getElementById("msg-archive"), TodoRuntime.message("Modifications enregistrées.", "Changes saved."));
    return true;
  } catch (error) {
    showMsg(document.getElementById("msg-archive"), error.message, true);
    return false;
  }
}

const btnArchiveDone = document.getElementById("btn-archive-done");
if (btnArchiveDone) {
    btnArchiveDone.addEventListener("click", async () => {
      try {
        if (!archiveStore) await loadArchiveStore();
        const todos = archiveStore.read();
        let changed = false;
        todos.forEach(t => {
            if (t.status === "done" && !t.archived && !TodoData.removed(t)) {
                t.archived = true;
                changed = true;
            }
        });
        
        const msgEl = document.getElementById("msg-archive");
        if (changed) {
            await saveArchivedChanges(todos);
        } else {
            showMsg(msgEl, TodoRuntime.message("Aucune tâche terminée à archiver.", "No completed tasks to archive."));
        }
      } catch (error) { showMsg(document.getElementById("msg-archive"), error.message, true); }
    });
    
    loadArchiveStore().then(updateArchivedView).catch(error => showMsg(document.getElementById("msg-archive"), error.message, true));
}


// ══════════════════════════════════════════════════════
//  6. GESTION DES ONGLETS
// ══════════════════════════════════════════════════════
const tabBtns = document.querySelectorAll('.settings-tab-btn');
const tabContents = document.querySelectorAll('.settings-tab-content');

if (tabBtns.length > 0) {
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Retirer la classe active de tous les boutons et contenus
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Ajouter la classe active au bouton cliqué et à son contenu cible
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });
}
