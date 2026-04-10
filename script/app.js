// ──────────────────────────────────────────────
// Session utilisateur
// ──────────────────────────────────────────────
const currentUser = sessionStorage.getItem("username") || "compte";

// ──────────────────────────────────────────────
// Références DOM
// ──────────────────────────────────────────────
const list              = document.getElementById("todo-list");
const todoCountEl       = document.getElementById("todo-count");
const doneCountEl       = document.getElementById("done-count");
const inprogressCountEl = document.getElementById("inprogress-count");
const progressBar       = document.getElementById("progress-bar");
const progressLabel     = document.getElementById("progress-label");
const filterBtns        = document.querySelectorAll(".filter-btn");
const fabAdd            = document.getElementById("fab-add");
const userLabel         = document.getElementById("user-label");
const searchInput       = document.getElementById("search-input");
const searchClear       = document.getElementById("search-clear");
const sortSelect        = document.getElementById("sort-select");

// Sync
const syncDot   = document.getElementById("sync-dot");
const syncLabel = document.getElementById("sync-label");

// Modale principale
const modalOverlay = document.getElementById("modal-overlay");
const modalClose   = document.getElementById("modal-close");
const modalHeading = document.getElementById("modal-heading");
const modalText    = document.getElementById("modal-text");
const modalStatus  = document.getElementById("modal-status");
const modalPriority= document.getElementById("modal-priority");
const modalDue     = document.getElementById("modal-due");
const modalNotes   = document.getElementById("modal-notes");
const modalSave    = document.getElementById("modal-save");
const modalDelete  = document.getElementById("modal-delete");

// Modale de confirmation
const confirmOverlay = document.getElementById("confirm-overlay");
const confirmYes     = document.getElementById("confirm-yes");
const confirmNo      = document.getElementById("confirm-no");

// ──────────────────────────────────────────────
// État
// ──────────────────────────────────────────────
let todos         = JSON.parse(localStorage.getItem(`todos_${currentUser}`)) || [];
let currentFilter = "all";
let searchQuery   = "";
let currentSort   = "created-desc";
let editingId     = null;
let firebaseUrl   = null;
let syncTimeout   = null;
let encKey        = null;  // CryptoKey AES-GCM dérivée du mot de passe

// ──────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────
async function init() {
  if (userLabel) userLabel.textContent = currentUser;

  // Charge la clé de chiffrement depuis la session
  const encKeyB64 = sessionStorage.getItem("encKey");
  if (encKeyB64) {
    try {
      encKey = await importKey(encKeyB64);
    } catch (e) {
      console.warn("Impossible de charger la clé de chiffrement :", e);
    }
  }

  try {
    const res    = await fetch("../json/config.json");
    const config = await res.json();

    if (config.firebaseUrl && config.firebaseUrl.trim() !== "") {
      firebaseUrl = config.firebaseUrl.replace(/\/$/, "");
      await loadFromFirebase();
    } else {
      setSyncStatus("offline");
    }
  } catch (e) {
    console.warn("Erreur config.json :", e);
    setSyncStatus("offline");
  }
  render();
}

// ──────────────────────────────────────────────
// Chemin Firebase
// ──────────────────────────────────────────────
function userTodosPath() {
  return `${firebaseUrl}/users/${encodeURIComponent(currentUser)}/todos.json`;
}

// ──────────────────────────────────────────────
// Chargement Firebase
// ──────────────────────────────────────────────
async function loadFromFirebase() {
  setSyncStatus("syncing");
  try {
    const res  = await fetch(userTodosPath());
    const data = await res.json();

    if (!data) {
      // Aucune donnée
      todos = [];

    } else if (isEncrypted(data)) {
      // ── Données chiffrées → déchiffrer ──
      if (encKey) {
        todos = await decryptData(data, encKey);
      } else {
        console.warn("Données chiffrées mais clé indisponible.");
        todos = [];
      }

    } else if (Array.isArray(data) && data.length > 0) {
      // ── Migration : tableau en clair → chiffrer ──
      todos = data;
      if (encKey) {
        console.log("Migration : chiffrement des données existantes...");
        const enc = await encryptData(todos, encKey);
        await fetch(userTodosPath(), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(enc)
        });
      }

    } else if (data && typeof data === "object") {
      // ── Ancien format objet → migration ──
      todos = Object.values(data).filter(v => v && typeof v === "object");
      if (encKey && todos.length > 0) {
        const enc = await encryptData(todos, encKey);
        await fetch(userTodosPath(), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(enc)
        });
      }
    }

    localStorage.setItem(`todos_${currentUser}`, JSON.stringify(todos));
    setSyncStatus("synced");
  } catch (e) {
    console.warn("Erreur chargement Firebase :", e);
    setSyncStatus("error");
  }
}

// ──────────────────────────────────────────────
// Sauvegarde (debounce 800ms)
// ──────────────────────────────────────────────
async function saveToFirebase() {
  if (!firebaseUrl) return;
  clearTimeout(syncTimeout);
  setSyncStatus("syncing");
  syncTimeout = setTimeout(async () => {
    try {
      // Chiffre les données si la clé est disponible
      const body = encKey
        ? JSON.stringify(await encryptData(todos, encKey))
        : JSON.stringify(todos);

      await fetch(userTodosPath(), {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body
      });
      setSyncStatus("synced");
    } catch (e) {
      console.warn("Erreur sync Firebase :", e);
      setSyncStatus("error");
    }
  }, 800);
}

function saveTodos() {
  localStorage.setItem(`todos_${currentUser}`, JSON.stringify(todos));
  saveToFirebase();
}

// ──────────────────────────────────────────────
// Indicateur de sync
// ──────────────────────────────────────────────
function setSyncStatus(status) {
  if (!syncDot || !syncLabel) return;
  syncDot.className = `sync-dot sync-${status}`;
  const labels = { syncing: "Sync...", synced: "Synchronisé", error: "Hors ligne", offline: "Local" };
  syncLabel.textContent = labels[status] || "";
}

// ──────────────────────────────────────────────
// Filtres
// ──────────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  });
});

// Recherche
searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  searchClear.style.display = searchQuery ? "" : "none";
  render();
});
searchClear.addEventListener("click", () => {
  searchInput.value = "";
  searchQuery = "";
  searchClear.style.display = "none";
  searchInput.focus();
  render();
});

// Tri
sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  render();
});

// ──────────────────────────────────────────────
// Labels de statut
// ──────────────────────────────────────────────
const STATUS_LABELS = {
  todo:       { label: "À faire",    icon: "📋" },
  inprogress: { label: "En cours",   icon: "⚡" },
  waiting:    { label: "En attente", icon: "⏳" },
  done:       { label: "Terminé",    icon: "✅" },
  cancelled:  { label: "Annulé",     icon: "❌" }
};
const STATUS_ORDER = ["inprogress", "todo", "waiting", "done", "cancelled"];
const PRIORITY_ORDER = { high: 0, normal: 1, low: 2 };

function getStatusInfo(s) { return STATUS_LABELS[s] || STATUS_LABELS["todo"]; }

// ──────────────────────────────────────────────
// Helpers date d'échéance
// ──────────────────────────────────────────────
function getDueInfo(due) {
  if (!due) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const d     = new Date(due + "T00:00:00");
  const diff  = Math.round((d - today) / 86400000);
  if (diff < 0)  return { label: "En retard",     cls: "due-overdue" };
  if (diff === 0) return { label: "Aujourd'hui",   cls: "due-today"   };
  if (diff === 1) return { label: "Demain",         cls: "due-soon"    };
  if (diff <= 3) return { label: `Dans ${diff}j`,  cls: "due-soon"    };
  return { label: new Date(due + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), cls: "due-ok" };
}

// ──────────────────────────────────────────────
// Tri des tâches
// ──────────────────────────────────────────────
function sortTodos(arr) {
  const copy = [...arr];
  switch (currentSort) {
    case "created-asc":
      return copy.sort((a, b) => (a.created || 0) > (b.created || 0) ? 1 : -1);
    case "priority-desc":
      return copy.sort((a, b) => (PRIORITY_ORDER[a.priority||"normal"]||1) - (PRIORITY_ORDER[b.priority||"normal"]||1));
    case "due-asc":
      return copy.sort((a, b) => {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return a.due > b.due ? 1 : -1;
      });
    case "status":
      return copy.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
    default: // created-desc
      return copy.sort((a, b) => (a.created || 0) < (b.created || 0) ? 1 : -1);
  }
}

// ──────────────────────────────────────────────
// Rendu de la liste
// ──────────────────────────────────────────────
function render() {
  list.innerHTML = "";

  let filtered = todos.filter(t =>
    currentFilter === "all" ? true : t.status === currentFilter
  );

  // Recherche textuelle
  if (searchQuery) {
    filtered = filtered.filter(t =>
      t.text.toLowerCase().includes(searchQuery) ||
      (t.notes && t.notes.toLowerCase().includes(searchQuery))
    );
  }

  // Tri
  filtered = sortTodos(filtered);

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.className = "todo-empty";
    empty.textContent = searchQuery
      ? `Aucun résultat pour « ${searchQuery} »`
      : currentFilter === "all"
        ? "Aucune tâche. Cliquez sur + pour en ajouter."
        : "Aucune tâche dans cette catégorie.";
    list.appendChild(empty);
    updateCounters();
    return;
  }

  filtered.forEach((todo, i) => {
    const info    = getStatusInfo(todo.status);
    const dueInfo = getDueInfo(todo.due);
    const prio    = todo.priority || "normal";

    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = todo.id;
    li.style.animationDelay = `${i * 35}ms`;

    const left = document.createElement("div");
    left.className = "todo-left";

    const badge = document.createElement("span");
    badge.className = "todo-badge";
    badge.textContent = `${info.icon} ${info.label}`;

    const textWrap = document.createElement("div");
    textWrap.className = "todo-text-wrap";

    const span = document.createElement("span");
    span.className = [
      "todo-text",
      todo.status === "done"      ? "done"      : "",
      todo.status === "cancelled" ? "cancelled" : ""
    ].join(" ").trim();
    span.textContent = todo.text;
    textWrap.appendChild(span);

    // Ligne meta: priorité + échéance
    const meta = document.createElement("div");
    meta.className = "todo-meta";

    if (prio !== "normal") {
      const prioBadge = document.createElement("span");
      prioBadge.className = `priority-badge priority-${prio}`;
      prioBadge.textContent = prio === "high" ? "🔴 Haute" : "🔵 Basse";
      meta.appendChild(prioBadge);
    }

    if (dueInfo) {
      const dueBadge = document.createElement("span");
      dueBadge.className = `due-badge ${dueInfo.cls}`;
      dueBadge.textContent = `📅 ${dueInfo.label}`;
      meta.appendChild(dueBadge);
    }

    if (meta.children.length > 0) textWrap.appendChild(meta);

    if (todo.notes && todo.notes.trim()) {
      const note = document.createElement("span");
      note.className = "todo-note-preview";
      note.textContent = todo.notes.length > 70
        ? todo.notes.slice(0, 70) + "…"
        : todo.notes;
      textWrap.appendChild(note);
    }

    left.appendChild(badge);
    left.appendChild(textWrap);

    const editBtn = document.createElement("button");
    editBtn.className = "todo-edit";
    editBtn.textContent = "Détails";
    editBtn.setAttribute("aria-label", `Modifier "${todo.text}"`);

    editBtn.addEventListener("click", e => { e.stopPropagation(); openModal(todo.id); });
    li.addEventListener("click", () => openModal(todo.id));

    li.appendChild(left);
    li.appendChild(editBtn);
    list.appendChild(li);
  });

  updateCounters();
}

// ──────────────────────────────────────────────
// Compteurs + barre de progression
// ──────────────────────────────────────────────
function updateCounters() {
  const total      = todos.length;
  const done       = todos.filter(t => t.status === "done").length;
  const inprogress = todos.filter(t => t.status === "inprogress").length;
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0;

  todoCountEl.textContent       = `${total} tâche${total > 1 ? "s" : ""}`;
  doneCountEl.textContent       = `${done} terminée${done > 1 ? "s" : ""}`;
  inprogressCountEl.textContent = `${inprogress} en cours`;

  if (progressBar) {
    progressBar.style.width = `${pct}%`;
    progressLabel.textContent = `${pct}%`;
  }
}

// ──────────────────────────────────────────────
// Modale — Ouvrir (null = ajout, id = édition)
// ──────────────────────────────────────────────
function openModal(id = null) {
  if (id === null) {
    editingId = null;
    modalHeading.textContent  = "Nouvelle tâche";
    modalSave.textContent     = "Créer";
    modalText.value           = "";
    modalStatus.value         = "todo";
    modalPriority.value       = "normal";
    modalDue.value            = "";
    modalNotes.value          = "";
    modalDelete.style.display = "none";
  } else {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    editingId = id;
    modalHeading.textContent  = "Modifier la tâche";
    modalSave.textContent     = "Enregistrer";
    modalText.value           = todo.text;
    modalStatus.value         = todo.status;
    modalPriority.value       = todo.priority || "normal";
    modalDue.value            = todo.due || "";
    modalNotes.value          = todo.notes || "";
    modalDelete.style.display = "";
  }

  modalOverlay.classList.add("open");
  document.body.classList.add("modal-open");
  setTimeout(() => modalText.focus(), 60);
}

// ──────────────────────────────────────────────
// Modale — Fermer
// ──────────────────────────────────────────────
function closeModal() {
  modalOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
  editingId = null;
}

// ──────────────────────────────────────────────
// Modale de confirmation — Supprimer
// ──────────────────────────────────────────────
function openConfirm(onConfirm) {
  confirmOverlay.classList.add("open");
  document.body.classList.add("modal-open");

  const doConfirm = () => {
    cleanup();
    onConfirm();
  };
  const doCancel = () => { cleanup(); };

  function cleanup() {
    confirmOverlay.classList.remove("open");
    confirmYes.removeEventListener("click", doConfirm);
    confirmNo.removeEventListener("click", doCancel);
  }

  confirmYes.addEventListener("click", doConfirm);
  confirmNo.addEventListener("click", doCancel);
}

// ──────────────────────────────────────────────
// Événements
// ──────────────────────────────────────────────
fabAdd.addEventListener("click", () => openModal(null));
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
confirmOverlay.addEventListener("click", e => {
  if (e.target === confirmOverlay) {
    confirmOverlay.classList.remove("open");
    document.body.classList.remove("modal-open");
  }
});
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); confirmOverlay.classList.remove("open"); } });

modalSave.addEventListener("click", () => {
  const newText = modalText.value.trim();
  if (!newText) { modalText.focus(); return; }

  if (editingId === null) {
    todos.push({
      id:       Date.now(),
      text:     newText,
      status:   modalStatus.value,
      priority: modalPriority.value,
      due:      modalDue.value || null,
      notes:    modalNotes.value.trim(),
      created:  new Date().toISOString()
    });
  } else {
    const idx = todos.findIndex(t => t.id === editingId);
    if (idx !== -1) {
      todos[idx].text     = newText;
      todos[idx].status   = modalStatus.value;
      todos[idx].priority = modalPriority.value;
      todos[idx].due      = modalDue.value || null;
      todos[idx].notes    = modalNotes.value.trim();
    }
  }

  saveTodos();
  render();
  closeModal();
});

modalDelete.addEventListener("click", () => {
  if (!editingId) return;
  const id = editingId;
  closeModal();
  openConfirm(() => {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    render();
  });
});

// Déconnexion
document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("auth");
  sessionStorage.removeItem("username");
  window.location.href = "../html/login.html";
});

// ──────────────────────────────────────────────
// Lancement
// ──────────────────────────────────────────────
init();