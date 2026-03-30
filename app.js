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
const filterBtns        = document.querySelectorAll(".filter-btn");
const fabAdd            = document.getElementById("fab-add");
const userLabel         = document.getElementById("user-label");

// Sync
const syncDot   = document.getElementById("sync-dot");
const syncLabel = document.getElementById("sync-label");

// Modale
const modalOverlay = document.getElementById("modal-overlay");
const modalClose   = document.getElementById("modal-close");
const modalHeading = document.getElementById("modal-heading");
const modalText    = document.getElementById("modal-text");
const modalStatus  = document.getElementById("modal-status");
const modalNotes   = document.getElementById("modal-notes");
const modalSave    = document.getElementById("modal-save");
const modalDelete  = document.getElementById("modal-delete");

// ──────────────────────────────────────────────
// État
// ──────────────────────────────────────────────
let todos         = JSON.parse(localStorage.getItem(`todos_${currentUser}`)) || [];
let currentFilter = "all";
let editingId     = null;
let firebaseUrl   = null;
let syncTimeout   = null;

// ──────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────
async function init() {
  // Afficher le nom d'utilisateur
  if (userLabel) userLabel.textContent = currentUser;

  try {
    const res    = await fetch("./config.json");
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
// Chemin Firebase = /users/{username}/todos
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

    if (Array.isArray(data) && data.length > 0) {
      todos = data;
    } else if (data && typeof data === "object" && !Array.isArray(data)) {
      todos = Object.values(data);
    }
    // Si null/vide → garde le localStorage ou vide

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
      await fetch(userTodosPath(), {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(todos)
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
function getStatusInfo(s) { return STATUS_LABELS[s] || STATUS_LABELS["todo"]; }

// ──────────────────────────────────────────────
// Rendu de la liste
// ──────────────────────────────────────────────
function render() {
  list.innerHTML = "";

  const filtered = todos.filter(t =>
    currentFilter === "all" ? true : t.status === currentFilter
  );

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.className = "todo-empty";
    empty.textContent = currentFilter === "all"
      ? "Aucune tâche. Cliquez sur + pour en ajouter."
      : "Aucune tâche dans cette catégorie.";
    list.appendChild(empty);
    updateCounters();
    return;
  }

  filtered.forEach((todo, i) => {
    const info = getStatusInfo(todo.status);

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
// Compteurs
// ──────────────────────────────────────────────
function updateCounters() {
  const total      = todos.length;
  const done       = todos.filter(t => t.status === "done").length;
  const inprogress = todos.filter(t => t.status === "inprogress").length;

  todoCountEl.textContent       = `${total} tâche${total > 1 ? "s" : ""}`;
  doneCountEl.textContent       = `${done} terminée${done > 1 ? "s" : ""}`;
  inprogressCountEl.textContent = `${inprogress} en cours`;
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
// Événements
// ──────────────────────────────────────────────
fabAdd.addEventListener("click", () => openModal(null));
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

modalSave.addEventListener("click", () => {
  const newText = modalText.value.trim();
  if (!newText) { modalText.focus(); return; }

  if (editingId === null) {
    todos.push({
      id:      Date.now(),
      text:    newText,
      status:  modalStatus.value,
      notes:   modalNotes.value.trim(),
      created: new Date().toISOString()
    });
  } else {
    const idx = todos.findIndex(t => t.id === editingId);
    if (idx !== -1) {
      todos[idx].text   = newText;
      todos[idx].status = modalStatus.value;
      todos[idx].notes  = modalNotes.value.trim();
    }
  }

  saveTodos();
  render();
  closeModal();
});

modalDelete.addEventListener("click", () => {
  if (!editingId) return;
  if (!confirm("Supprimer cette tâche ?")) return;
  todos = todos.filter(t => t.id !== editingId);
  saveTodos();
  render();
  closeModal();
});

// Déconnexion
document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("auth");
  sessionStorage.removeItem("username");
  window.location.href = "./login.html";
});

// ──────────────────────────────────────────────
// Lancement
// ──────────────────────────────────────────────
init();